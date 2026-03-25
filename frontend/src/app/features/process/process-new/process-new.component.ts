import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DegreeProcessService } from '../../../core/services/degree-process.service';
import { DegreeModality } from '../../../core/models/degree-process.model';

interface ModalityCard {
  code: string;
  name: string;
  description: string;
  icon: string;
  requirements: string[];
}

// Default icons and descriptions for known modality codes
const MODALITY_DEFAULTS: Record<string, { icon: string; description: string }> = {
  THESIS: { icon: '📚', description: 'Proyecto de investigación original con defensa' },
  INTERNSHIP: { icon: '💼', description: 'Experiencia laboral supervisada' },
  RESEARCH_LINE: { icon: '🔬', description: 'Participación en proyecto de investigación' },
  DIPLOMA: { icon: '🎓', description: 'Programa de especialización' },
};

@Component({
  selector: 'app-process-new',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './process-new.component.html',
  styleUrl: './process-new.component.css'
})
export class ProcessNewComponent implements OnInit {
  currentStep = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  selectedModality = signal<string | null>(null);
  modalities = signal<DegreeModality[]>([]);

  form!: FormGroup;

  // Built dynamically from backend modalities
  modalityCards = computed<ModalityCard[]>(() => {
    return this.modalities().map(m => {
      const defaults = MODALITY_DEFAULTS[m.code] || { icon: '📄', description: m.description };
      const requirements = m.requirements?.map(r => r.documentType?.name || 'Documento') || [];
      return {
        code: m.code,
        name: m.name,
        description: defaults.description || m.description,
        icon: defaults.icon,
        requirements,
      };
    });
  });

  selectedModalityData = computed(() => {
    const code = this.selectedModality();
    return code ? this.modalityCards().find(m => m.code === code) : null;
  });

  canProceedToStep2 = computed(() => !!this.selectedModality());

  get canProceedToStep3(): boolean {
    return !!(this.form?.valid && this.selectedModality());
  }

  constructor(
    private processService: DegreeProcessService,
    private formBuilder: FormBuilder,
    public router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadModalities();
  }

  initForm(): void {
    this.form = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]]
    });
  }

  loadModalities(): void {
    this.loading.set(true);
    this.processService.getModalities().subscribe({
      next: (modalities) => {
        this.modalities.set(modalities);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading modalities:', err);
        this.error.set('Error al cargar las modalidades');
        this.loading.set(false);
      }
    });
  }

  selectModality(code: string): void {
    this.selectedModality.set(code);
  }

  goToStep(step: number): void {
    if (step === 2 && !this.canProceedToStep2()) return;
    if (step === 3 && !this.canProceedToStep3) return;
    this.currentStep.set(step);
    this.error.set(null);
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
      this.error.set(null);
    }
  }

  submitForm(): void {
    if (!this.form.valid || !this.selectedModality()) {
      this.error.set('Por favor completa todos los campos requeridos');
      return;
    }

    // Obtener el UUID real de la modalidad seleccionada (el backend exige @IsUUID)
    const selectedCode = this.selectedModality();
    const matchedModality = this.modalities().find(m => m.code === selectedCode);

    if (!matchedModality) {
      this.error.set('Modalidad no encontrada. Por favor selecciona una modalidad válida.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload = {
      modalityId: matchedModality.id,      // UUID requerido por el backend
      title: this.form.get('title')?.value,
      description: this.form.get('description')?.value
    };

    this.processService.createProcess(payload).subscribe({
      next: (process) => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => {
          this.router.navigate(['/process', process.id]);
        }, 2000);
      },
      error: (err) => {
        console.error('Error creating process:', err);
        this.error.set(err?.error?.error || err?.error?.message || 'Error al crear el proceso. Intente de nuevo.');
        this.loading.set(false);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field?.errors || !field?.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    return 'Campo inválido';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

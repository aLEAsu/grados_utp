import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DegreeProcessService } from '../../../core/services/degree-process.service';
import { DegreeModality, DegreeModalityCode } from '../../../core/models/degree-process.model';

interface ModalityCard {
  code: DegreeModalityCode;
  name: string;
  description: string;
  icon: string;
  requirements: string[];
}

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

  selectedModality = signal<DegreeModalityCode | null>(null);
  modalities = signal<DegreeModality[]>([]);

  form!: FormGroup;

  modalityCards: ModalityCard[] = [
    {
      code: DegreeModalityCode.THESIS,
      name: 'Tesis',
      description: 'Proyecto de investigación original con defensa',
      icon: '📚',
      requirements: [
        'Propuesta de tesis aprobada',
        'Documento completo de tesis',
        'Acta de defensa',
        'Certificado de correcciones'
      ]
    },
    {
      code: DegreeModalityCode.INTERNSHIP,
      name: 'Pasantía',
      description: 'Experiencia laboral supervisada',
      icon: '💼',
      requirements: [
        'Solicitud de pasantía',
        'Plan de pasantía',
        'Informe final',
        'Evaluación del supervisor'
      ]
    },
    {
      code: DegreeModalityCode.RESEARCH_LINE,
      name: 'Línea de Investigación',
      description: 'Participación en proyecto de investigación',
      icon: '🔬',
      requirements: [
        'Propuesta de investigación',
        'Artículo científico',
        'Reporte técnico',
        'Certificado de participación'
      ]
    },
    {
      code: DegreeModalityCode.DIPLOMA,
      name: 'Diplomado',
      description: 'Programa de especialización',
      icon: '🎓',
      requirements: [
        'Registro de inscripción',
        'Certificado de aprobación',
        'Proyecto final',
        'Constancia de participación'
      ]
    }
  ];

  selectedModalityData = computed(() => {
    const code = this.selectedModality();
    return code ? this.modalityCards.find(m => m.code === code) : null;
  });

  canProceedToStep2 = computed(() => !!this.selectedModality());
  canProceedToStep3 = computed(() => this.form?.valid && this.selectedModality());

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

  selectModality(code: DegreeModalityCode): void {
    this.selectedModality.set(code);
  }

  goToStep(step: number): void {
    if (step === 2 && !this.canProceedToStep2()) return;
    if (step === 3 && !this.canProceedToStep3()) return;
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

    this.loading.set(true);
    this.error.set(null);

    const payload = {
      modalityId: this.selectedModality(),
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
        this.error.set(err?.error?.message || 'Error al crear el proceso. Intente de nuevo.');
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

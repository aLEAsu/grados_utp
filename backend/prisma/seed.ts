import { PrismaClient, UserRole, DegreeModalityCode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Seed Degree Modalities
  console.log('Seeding degree modalities...');
  const modalityTesis = await prisma.degreeModality.upsert({
    where: { code: DegreeModalityCode.THESIS },
    update: {},
    create: {
      name: 'Tesis',
      code: DegreeModalityCode.THESIS,
      description: 'Modalidad de grado mediante elaboración de tesis',
      isActive: true,
    },
  });

  const modalityPasantias = await prisma.degreeModality.upsert({
    where: { code: DegreeModalityCode.INTERNSHIP },
    update: {},
    create: {
      name: 'Pasantías',
      code: DegreeModalityCode.INTERNSHIP,
      description: 'Modalidad de grado mediante pasantías profesionales',
      isActive: true,
    },
  });

  const modalityLineasInvestigacion = await prisma.degreeModality.upsert({
    where: { code: DegreeModalityCode.RESEARCH_LINE },
    update: {},
    create: {
      name: 'Líneas de Investigación',
      code: DegreeModalityCode.RESEARCH_LINE,
      description: 'Modalidad de grado mediante participación en líneas de investigación',
      isActive: true,
    },
  });

  const modalityDiplomados = await prisma.degreeModality.upsert({
    where: { code: DegreeModalityCode.DIPLOMA },
    update: {},
    create: {
      name: 'Diplomados',
      code: DegreeModalityCode.DIPLOMA,
      description: 'Modalidad de grado mediante diplomados especializados',
      isActive: true,
    },
  });

  // Seed Document Types
  console.log('Seeding document types...');
  const documentTypes = await Promise.all([
    prisma.documentType.upsert({
      where: { code: 'CARTA_PRESENTACION' },
      update: {},
      create: {
        name: 'Carta de presentación',
        code: 'CARTA_PRESENTACION',
        description: 'Carta de presentación del proyecto o propuesta',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 10,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'ANTEPROYECTO' },
      update: {},
      create: {
        name: 'Anteproyecto',
        code: 'ANTEPROYECTO',
        description: 'Documento de anteproyecto con planteamiento del problema',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 15,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'INFORME_FINAL' },
      update: {},
      create: {
        name: 'Informe final',
        code: 'INFORME_FINAL',
        description: 'Informe final del proyecto o trabajo realizado',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 20,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'CERTIFICADO_NOTAS' },
      update: {},
      create: {
        name: 'Certificado de notas',
        code: 'CERTIFICADO_NOTAS',
        description: 'Certificado académico de calificaciones',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 10,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'PAZ_Y_SALVO' },
      update: {},
      create: {
        name: 'Paz y salvo',
        code: 'PAZ_Y_SALVO',
        description: 'Documento de paz y salvo financiero de la institución',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 5,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'ACTA_SUSTENTACION' },
      update: {},
      create: {
        name: 'Acta de sustentación',
        code: 'ACTA_SUSTENTACION',
        description: 'Acta de la sustentación pública del proyecto',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 5,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'CARTA_ASESOR' },
      update: {},
      create: {
        name: 'Carta del asesor',
        code: 'CARTA_ASESOR',
        description: 'Carta de aprobación del asesor del proyecto',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 5,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'CERTIFICADO_PASANTIA' },
      update: {},
      create: {
        name: 'Certificado de pasantía',
        code: 'CERTIFICADO_PASANTIA',
        description: 'Certificado de cumplimiento de pasantía por empresa',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 5,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'ARTICULO_CIENTIFICO' },
      update: {},
      create: {
        name: 'Artículo científico',
        code: 'ARTICULO_CIENTIFICO',
        description: 'Artículo científico resultante de la investigación',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 15,
      },
    }),
    prisma.documentType.upsert({
      where: { code: 'CERTIFICADO_DIPLOMADO' },
      update: {},
      create: {
        name: 'Certificado de diplomado',
        code: 'CERTIFICADO_DIPLOMADO',
        description: 'Certificado de aprobación del diplomado',
        acceptedMimeTypes: ['application/pdf'],
        maxFileSizeMb: 5,
      },
    }),
  ]);

  const docMap = documentTypes.reduce((acc, doc) => {
    acc[doc.code] = doc.id;
    return acc;
  }, {} as Record<string, string>);

  // Seed Modality Requirements
  console.log('Seeding modality requirements...');

  // Tesis requirements
  const tesisDocs = [
    { docCode: 'CARTA_PRESENTACION', order: 1 },
    { docCode: 'ANTEPROYECTO', order: 2 },
    { docCode: 'INFORME_FINAL', order: 3 },
    { docCode: 'CERTIFICADO_NOTAS', order: 4 },
    { docCode: 'PAZ_Y_SALVO', order: 5 },
    { docCode: 'ACTA_SUSTENTACION', order: 6 },
    { docCode: 'CARTA_ASESOR', order: 7 },
  ];

  for (const doc of tesisDocs) {
    await prisma.modalityRequirement.upsert({
      where: {
        modalityId_documentTypeId: {
          modalityId: modalityTesis.id,
          documentTypeId: docMap[doc.docCode],
        },
      },
      update: {},
      create: {
        modalityId: modalityTesis.id,
        documentTypeId: docMap[doc.docCode],
        isRequired: true,
        displayOrder: doc.order,
      },
    });
  }

  // Pasantías requirements
  const pasantiasDocs = [
    { docCode: 'CARTA_PRESENTACION', order: 1 },
    { docCode: 'CERTIFICADO_PASANTIA', order: 2 },
    { docCode: 'INFORME_FINAL', order: 3 },
    { docCode: 'CERTIFICADO_NOTAS', order: 4 },
    { docCode: 'PAZ_Y_SALVO', order: 5 },
    { docCode: 'CARTA_ASESOR', order: 6 },
  ];

  for (const doc of pasantiasDocs) {
    await prisma.modalityRequirement.upsert({
      where: {
        modalityId_documentTypeId: {
          modalityId: modalityPasantias.id,
          documentTypeId: docMap[doc.docCode],
        },
      },
      update: {},
      create: {
        modalityId: modalityPasantias.id,
        documentTypeId: docMap[doc.docCode],
        isRequired: true,
        displayOrder: doc.order,
      },
    });
  }

  // Líneas de Investigación requirements
  const lineasDocs = [
    { docCode: 'CARTA_PRESENTACION', order: 1 },
    { docCode: 'ARTICULO_CIENTIFICO', order: 2 },
    { docCode: 'INFORME_FINAL', order: 3 },
    { docCode: 'CERTIFICADO_NOTAS', order: 4 },
    { docCode: 'PAZ_Y_SALVO', order: 5 },
    { docCode: 'CARTA_ASESOR', order: 6 },
  ];

  for (const doc of lineasDocs) {
    await prisma.modalityRequirement.upsert({
      where: {
        modalityId_documentTypeId: {
          modalityId: modalityLineasInvestigacion.id,
          documentTypeId: docMap[doc.docCode],
        },
      },
      update: {},
      create: {
        modalityId: modalityLineasInvestigacion.id,
        documentTypeId: docMap[doc.docCode],
        isRequired: true,
        displayOrder: doc.order,
      },
    });
  }

  // Diplomados requirements
  const diplomadosDocs = [
    { docCode: 'CARTA_PRESENTACION', order: 1 },
    { docCode: 'CERTIFICADO_DIPLOMADO', order: 2 },
    { docCode: 'CERTIFICADO_NOTAS', order: 3 },
    { docCode: 'PAZ_Y_SALVO', order: 4 },
  ];

  for (const doc of diplomadosDocs) {
    await prisma.modalityRequirement.upsert({
      where: {
        modalityId_documentTypeId: {
          modalityId: modalityDiplomados.id,
          documentTypeId: docMap[doc.docCode],
        },
      },
      update: {},
      create: {
        modalityId: modalityDiplomados.id,
        documentTypeId: docMap[doc.docCode],
        isRequired: true,
        displayOrder: doc.order,
      },
    });
  }

  // Seed Users
  console.log('Seeding users...');

  const superAdminPasswordHash = await bcrypt.hash('Admin@2024', 10);
  await prisma.user.upsert({
    where: { email: 'admin@itp.edu.co' },
    update: {},
    create: {
      email: 'admin@itp.edu.co',
      passwordHash: superAdminPasswordHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: UserRole.SUPERADMIN,
      isActive: true,
      emailVerified: true,
      institutionalEmail: 'admin@itp.edu.co',
    },
  });

  const secretaryPasswordHash = await bcrypt.hash('Secretary@2024', 10);
  await prisma.user.upsert({
    where: { email: 'secretaria@itp.edu.co' },
    update: {},
    create: {
      email: 'secretaria@itp.edu.co',
      passwordHash: secretaryPasswordHash,
      firstName: 'Secretaría',
      lastName: 'Grados',
      role: UserRole.SECRETARY,
      isActive: true,
      emailVerified: true,
      institutionalEmail: 'secretaria@itp.edu.co',
    },
  });

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

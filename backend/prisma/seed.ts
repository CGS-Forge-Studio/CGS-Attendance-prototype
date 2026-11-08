import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data and restarting identity sequences...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "attendances", "students", "teachers", "classes" RESTART IDENTITY CASCADE;`);
  
  console.log('Seeding Class 11-C...');

  // 1. Create the Class and Teacher
  const classRecord = await prisma.class.create({
    data: {
      name: '11-C',
      section: 'C',
      teacherName: 'Swarnamugi Mam',
      totalStrength: 40,
    },
  });

  // 2. Generate the 40 placeholder students (11c01 to 11c40 -> IDs 1 to 40)
  const studentsToInsert = Array.from({ length: 40 }, (_, i) => {
    const suffix = (i + 1).toString().padStart(2, '0'); 
    const rollNumber = `11c${suffix}`;
    
    return {
      rollNumber: rollNumber,
      name: rollNumber,
      classId: classRecord.id,
    };
  });

  // 3. Insert them into the database
  await prisma.student.createMany({
    data: studentsToInsert,
  });

  console.log('✅ Successfully seeded Swarnamugi and 40 students with IDs 1 to 40.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

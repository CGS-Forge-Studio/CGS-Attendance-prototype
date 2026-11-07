import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  // Clear any existing attendance and old placeholder students for a clean slate
  await prisma.attendance.deleteMany();
  await prisma.student.deleteMany();
  
  console.log('Seeding Class 11-C...');

  // 1. Create the Class and Teacher
  const classRecord = await prisma.class.upsert({
    where: { name: '11-C' },
    update: {
      teacherName: 'Swarnamugi',
      totalStrength: 40,
    },
    create: {
      name: '11-C',
      teacherName: 'Swarnamugi',
      totalStrength: 40,
    },
  });

  // 2. Generate the 40 placeholder students (11c01 to 11c40)
  const studentsToInsert = Array.from({ length: 40 }, (_, i) => {
    // Pads single digits with a zero (e.g., 1 -> 01)
    const suffix = (i + 1).toString().padStart(2, '0'); 
    const rollNumber = `11c${suffix}`;
    
    return {
      rollNumber: rollNumber,
      name: rollNumber, // Using roll number as the name for now
      classId: classRecord.id,
    };
  });

  // 3. Insert them into the database
  await prisma.student.createMany({
    data: studentsToInsert,
    skipDuplicates: true, // Prevents errors if you run this twice
  });

  console.log('✅ Successfully seeded Swarnamugi and 40 students.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

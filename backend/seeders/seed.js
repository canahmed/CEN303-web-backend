const { User, Department, Student, Faculty, sequelize, testConnection, syncDatabase } = require('../src/models');
const { hashPassword } = require('../src/utils/hash');

// Seed data
const departments = [
    { name: 'Bilgisayar Mühendisliği', code: 'CSE', faculty: 'Mühendislik Fakültesi' },
    { name: 'Elektrik-Elektronik Mühendisliği', code: 'EEE', faculty: 'Mühendislik Fakültesi' },
    { name: 'Makine Mühendisliği', code: 'ME', faculty: 'Mühendislik Fakültesi' },
    { name: 'İşletme', code: 'BUS', faculty: 'İktisadi ve İdari Bilimler Fakültesi' },
    { name: 'Psikoloji', code: 'PSY', faculty: 'Fen-Edebiyat Fakültesi' }
];

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...\n');

        // Connect and sync
        await testConnection();
        await syncDatabase({ force: true }); // WARNING: This drops all tables!

        console.log('📁 Creating departments...');
        const createdDepartments = await Department.bulkCreate(departments);
        console.log(`   ✅ Created ${createdDepartments.length} departments\n`);

        const cseDept = createdDepartments.find(d => d.code === 'CSE');
        const eeeDept = createdDepartments.find(d => d.code === 'EEE');

        // Create admin user
        console.log('👤 Creating admin user...');
        const adminPassword = await hashPassword('Admin123!');
        const admin = await User.create({
            email: 'admin@smartcampus.com',
            password_hash: adminPassword,
            role: 'admin',
            first_name: 'Admin',
            last_name: 'User',
            is_active: true
        });
        console.log(`   ✅ Admin: admin@smartcampus.com / Admin123!\n`);

        // Create faculty users
        console.log('👨‍🏫 Creating faculty users...');
        const facultyPassword = await hashPassword('Faculty123!');

        const faculty1 = await User.create({
            email: 'mehmet.sevri@smartcampus.com',
            password_hash: facultyPassword,
            role: 'faculty',
            first_name: 'Mehmet',
            last_name: 'Sevri',
            is_active: true
        });
        await Faculty.create({
            user_id: faculty1.id,
            employee_number: 'FAC001',
            title: 'Dr. Öğr. Üyesi',
            department_id: cseDept.id,
            office_location: 'Mühendislik Binası A-301'
        });

        const faculty2 = await User.create({
            email: 'ayse.yilmaz@smartcampus.com',
            password_hash: facultyPassword,
            role: 'faculty',
            first_name: 'Ayşe',
            last_name: 'Yılmaz',
            is_active: true
        });
        await Faculty.create({
            user_id: faculty2.id,
            employee_number: 'FAC002',
            title: 'Prof. Dr.',
            department_id: eeeDept.id,
            office_location: 'Mühendislik Binası B-205'
        });
        console.log(`   ✅ Created 2 faculty members\n`);

        // Create student users
        console.log('👨‍🎓 Creating student users...');
        const studentPassword = await hashPassword('Student123!');

        const students = [
            { email: 'can.ahmed@smartcampus.com', firstName: 'Can', lastName: 'Ahmed', studentNumber: '2021001', deptId: cseDept.id },
            { email: 'ali.veli@smartcampus.com', firstName: 'Ali', lastName: 'Veli', studentNumber: '2021002', deptId: cseDept.id },
            { email: 'zeynep.kaya@smartcampus.com', firstName: 'Zeynep', lastName: 'Kaya', studentNumber: '2021003', deptId: eeeDept.id },
            { email: 'ahmet.demir@smartcampus.com', firstName: 'Ahmet', lastName: 'Demir', studentNumber: '2021004', deptId: cseDept.id },
            { email: 'fatma.sahin@smartcampus.com', firstName: 'Fatma', lastName: 'Şahin', studentNumber: '2021005', deptId: eeeDept.id }
        ];

        for (const s of students) {
            const user = await User.create({
                email: s.email,
                password_hash: studentPassword,
                role: 'student',
                first_name: s.firstName,
                last_name: s.lastName,
                is_active: true
            });
            await Student.create({
                user_id: user.id,
                student_number: s.studentNumber,
                department_id: s.deptId,
                enrollment_year: 2021,
                gpa: (Math.random() * 2 + 2).toFixed(2), // Random GPA between 2.00-4.00
                cgpa: (Math.random() * 2 + 2).toFixed(2)
            });
        }
        console.log(`   ✅ Created ${students.length} students\n`);

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Database seeding completed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📋 Test Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Admin:   admin@smartcampus.com / Admin123!');
        console.log('Faculty: mehmet.sevri@smartcampus.com / Faculty123!');
        console.log('Student: can.ahmed@smartcampus.com / Student123!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run seeder
seedDatabase();

const { User, Department, Student, Faculty, sequelize } = require('../models');
const { hashPassword } = require('./hash');

/**
 * Checks if database needs seeding and seeds if necessary
 * This is safe to run multiple times - only seeds if users table is empty
 */
const autoSeed = async () => {
    try {
        // Check if users exist
        const userCount = await User.count();

        if (userCount > 0) {
            console.log('📊 Database already has data, skipping auto-seed');
            return false;
        }

        console.log('🌱 Database is empty, starting auto-seed...\n');

        // Seed departments
        const departments = [
            { name: 'Bilgisayar Mühendisliği', code: 'CSE', faculty: 'Mühendislik Fakültesi' },
            { name: 'Elektrik-Elektronik Mühendisliği', code: 'EEE', faculty: 'Mühendislik Fakültesi' },
            { name: 'Makine Mühendisliği', code: 'ME', faculty: 'Mühendislik Fakültesi' },
            { name: 'İşletme', code: 'BUS', faculty: 'İktisadi ve İdari Bilimler Fakültesi' },
            { name: 'Psikoloji', code: 'PSY', faculty: 'Fen-Edebiyat Fakültesi' }
        ];

        console.log('📁 Creating departments...');
        const createdDepartments = await Department.bulkCreate(departments);
        console.log(`   ✅ Created ${createdDepartments.length} departments`);

        const cseDept = createdDepartments.find(d => d.code === 'CSE');
        const eeeDept = createdDepartments.find(d => d.code === 'EEE');

        // Create admin user
        console.log('👤 Creating admin user...');
        const adminPassword = await hashPassword('Admin123!');
        await User.create({
            email: 'admin@smartcampus.com',
            password_hash: adminPassword,
            role: 'admin',
            first_name: 'Admin',
            last_name: 'User',
            is_active: true
        });
        console.log('   ✅ Admin: admin@smartcampus.com / Admin123!');

        // Create faculty
        console.log('👨‍🏫 Creating faculty...');
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
        console.log('   ✅ Faculty: mehmet.sevri@smartcampus.com / Faculty123!');

        // Create students
        console.log('👨‍🎓 Creating students...');
        const studentPassword = await hashPassword('Student123!');
        const student1 = await User.create({
            email: 'can.ahmed@smartcampus.com',
            password_hash: studentPassword,
            role: 'student',
            first_name: 'Can',
            last_name: 'Ahmed',
            is_active: true
        });
        await Student.create({
            user_id: student1.id,
            student_number: '2021001',
            department_id: cseDept.id,
            enrollment_year: 2021,
            gpa: 3.50,
            cgpa: 3.45
        });
        console.log('   ✅ Student: can.ahmed@smartcampus.com / Student123!');

        console.log('\n🎉 Auto-seed completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Auto-seed error:', error.message);
        // Don't throw - let the app continue even if seed fails
        return false;
    }
};

module.exports = { autoSeed };

const {
    User, Department, Student, Faculty,
    Course, CourseSection, CoursePrerequisite,
    Classroom, Enrollment
} = require('../models');
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

        // ==========================================
        // Seed Departments
        // ==========================================
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

        // ==========================================
        // Seed Classrooms
        // ==========================================
        console.log('🏫 Creating classrooms...');
        const classrooms = [
            { building: 'Mühendislik Binası', room_number: 'A-101', capacity: 50, latitude: 41.0082, longitude: 28.9784, features_json: ['projector', 'whiteboard', 'ac'] },
            { building: 'Mühendislik Binası', room_number: 'A-102', capacity: 40, latitude: 41.0083, longitude: 28.9785, features_json: ['projector', 'whiteboard'] },
            { building: 'Mühendislik Binası', room_number: 'B-201', capacity: 30, latitude: 41.0084, longitude: 28.9786, features_json: ['projector', 'computer_lab'] },
            { building: 'Fen-Edebiyat Binası', room_number: 'C-301', capacity: 60, latitude: 41.0090, longitude: 28.9790, features_json: ['projector', 'whiteboard', 'ac'] },
            { building: 'Kütüphane', room_number: 'Seminer-1', capacity: 100, latitude: 41.0095, longitude: 28.9795, features_json: ['projector', 'mic', 'ac'] }
        ];
        const createdClassrooms = await Classroom.bulkCreate(classrooms);
        console.log(`   ✅ Created ${createdClassrooms.length} classrooms`);

        // ==========================================
        // Seed Users (Admin, Faculty, Students)
        // ==========================================
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
        const studentRecord1 = await Student.create({
            user_id: student1.id,
            student_number: '2021001',
            department_id: cseDept.id,
            enrollment_year: 2021,
            gpa: 3.50,
            cgpa: 3.45
        });

        const student2 = await User.create({
            email: 'ali.veli@smartcampus.com',
            password_hash: studentPassword,
            role: 'student',
            first_name: 'Ali',
            last_name: 'Veli',
            is_active: true
        });
        const studentRecord2 = await Student.create({
            user_id: student2.id,
            student_number: '2021002',
            department_id: cseDept.id,
            enrollment_year: 2021,
            gpa: 3.20,
            cgpa: 3.15
        });

        const student3 = await User.create({
            email: 'zeynep.kaya@smartcampus.com',
            password_hash: studentPassword,
            role: 'student',
            first_name: 'Zeynep',
            last_name: 'Kaya',
            is_active: true
        });
        await Student.create({
            user_id: student3.id,
            student_number: '2021003',
            department_id: eeeDept.id,
            enrollment_year: 2021,
            gpa: 3.80,
            cgpa: 3.75
        });
        console.log('   ✅ Student: can.ahmed@smartcampus.com / Student123!');

        // ==========================================
        // Seed Courses
        // ==========================================
        console.log('📚 Creating courses...');
        const courses = [
            { code: 'CSE101', name: 'Programlamaya Giriş', description: 'Temel programlama kavramları ve C dili', credits: 4, ects: 6, department_id: cseDept.id },
            { code: 'CSE201', name: 'Veri Yapıları', description: 'Temel veri yapıları ve algoritmalar', credits: 4, ects: 6, department_id: cseDept.id },
            { code: 'CSE301', name: 'Veritabanı Sistemleri', description: 'İlişkisel veritabanları ve SQL', credits: 3, ects: 5, department_id: cseDept.id },
            { code: 'CSE303', name: 'Web Tabanlı Programlama', description: 'Frontend ve Backend web geliştirme', credits: 3, ects: 5, department_id: cseDept.id },
            { code: 'CSE401', name: 'Yapay Zeka', description: 'Makine öğrenmesi ve derin öğrenme temelleri', credits: 3, ects: 5, department_id: cseDept.id },
            { code: 'EEE101', name: 'Elektrik Devre Temelleri', description: 'DC ve AC devre analizi', credits: 4, ects: 6, department_id: eeeDept.id },
            { code: 'EEE201', name: 'Elektronik I', description: 'Yarı iletken elemanlar ve temel devreler', credits: 3, ects: 5, department_id: eeeDept.id },
            { code: 'MATH101', name: 'Matematik I', description: 'Kalkülüs ve lineer cebir temelleri', credits: 4, ects: 6, department_id: cseDept.id }
        ];
        const createdCourses = await Course.bulkCreate(courses);
        console.log(`   ✅ Created ${createdCourses.length} courses`);

        // ==========================================
        // Seed Course Prerequisites
        // ==========================================
        console.log('🔗 Creating course prerequisites...');
        const cse101 = createdCourses.find(c => c.code === 'CSE101');
        const cse201 = createdCourses.find(c => c.code === 'CSE201');
        const cse301 = createdCourses.find(c => c.code === 'CSE301');
        const cse303 = createdCourses.find(c => c.code === 'CSE303');
        const cse401 = createdCourses.find(c => c.code === 'CSE401');

        const prerequisites = [
            { course_id: cse201.id, prerequisite_course_id: cse101.id }, // CSE201 requires CSE101
            { course_id: cse301.id, prerequisite_course_id: cse201.id }, // CSE301 requires CSE201
            { course_id: cse303.id, prerequisite_course_id: cse201.id }, // CSE303 requires CSE201
            { course_id: cse401.id, prerequisite_course_id: cse201.id }, // CSE401 requires CSE201
            { course_id: cse401.id, prerequisite_course_id: cse301.id }  // CSE401 requires CSE301
        ];
        await CoursePrerequisite.bulkCreate(prerequisites);
        console.log(`   ✅ Created ${prerequisites.length} prerequisites`);

        // ==========================================
        // Seed Course Sections
        // ==========================================
        console.log('📅 Creating course sections...');
        const classroom1 = createdClassrooms[0];
        const classroom2 = createdClassrooms[1];

        const sections = [
            {
                course_id: cse101.id,
                section_number: '01',
                semester: 'fall',
                year: 2024,
                instructor_id: faculty1.id,
                capacity: 40,
                enrolled_count: 0,
                classroom_id: classroom1.id,
                schedule_json: [
                    { day: 'Monday', start_time: '09:00', end_time: '10:30' },
                    { day: 'Wednesday', start_time: '09:00', end_time: '10:30' }
                ]
            },
            {
                course_id: cse201.id,
                section_number: '01',
                semester: 'fall',
                year: 2024,
                instructor_id: faculty1.id,
                capacity: 35,
                enrolled_count: 0,
                classroom_id: classroom2.id,
                schedule_json: [
                    { day: 'Tuesday', start_time: '13:00', end_time: '14:30' },
                    { day: 'Thursday', start_time: '13:00', end_time: '14:30' }
                ]
            },
            {
                course_id: cse303.id,
                section_number: '01',
                semester: 'fall',
                year: 2024,
                instructor_id: faculty1.id,
                capacity: 30,
                enrolled_count: 0,
                classroom_id: classroom1.id,
                schedule_json: [
                    { day: 'Friday', start_time: '10:00', end_time: '12:30' }
                ]
            }
        ];
        const createdSections = await CourseSection.bulkCreate(sections);
        console.log(`   ✅ Created ${createdSections.length} sections`);

        // ==========================================
        // Seed Enrollments (sample)
        // ==========================================
        console.log('📝 Creating sample enrollments...');
        const section1 = createdSections[0]; // CSE101

        // Enroll students in CSE101
        await Enrollment.create({
            student_id: studentRecord1.id,
            section_id: section1.id,
            status: 'completed',
            enrollment_date: '2024-09-01',
            midterm_grade: 85,
            final_grade: 90,
            letter_grade: 'AA',
            grade_point: 4.00
        });

        await Enrollment.create({
            student_id: studentRecord2.id,
            section_id: section1.id,
            status: 'completed',
            enrollment_date: '2024-09-01',
            midterm_grade: 70,
            final_grade: 75,
            letter_grade: 'CB',
            grade_point: 2.50
        });

        // Update enrolled count
        await section1.update({ enrolled_count: 2 });
        console.log('   ✅ Created sample enrollments');

        // Seed Part 3 data
        try {
            const { seedPart3Data } = require('./seedPart3');
            await seedPart3Data();
        } catch (part3Error) {
            console.warn('⚠️ Part 3 seed skipped:', part3Error.message);
        }

        console.log('\n🎉 Auto-seed completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Auto-seed error:', error.message);
        // Don't throw - let the app continue even if seed fails
        return false;
    }
};

module.exports = { autoSeed };


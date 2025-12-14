const { Student, Faculty, Enrollment, CourseSection } = require('../models');
const GradeService = require('../services/gradeService');
const ApiError = require('../utils/ApiError');

/**
 * Get my grades
 */
const getMyGrades = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler bu endpoint\'i kullanabilir');
        }

        const grades = await GradeService.getStudentGrades(student.id);

        res.json({
            success: true,
            data: grades
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transcript JSON
 */
const getTranscript = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler bu endpoint\'i kullanabilir');
        }

        const transcript = await GradeService.generateTranscript(student.id);

        res.json({
            success: true,
            data: transcript
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transcript PDF
 */
const getTranscriptPdf = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler bu endpoint\'i kullanabilir');
        }

        const transcript = await GradeService.generateTranscript(student.id);

        // Generate simple HTML-based PDF (can be enhanced with PDFKit later)
        const html = generateTranscriptHtml(transcript);

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'attachment; filename=transcript.html');
        res.send(html);

    } catch (error) {
        next(error);
    }
};

/**
 * Enter grades (Faculty only)
 */
const enterGrades = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { enrollment_id, midterm_grade, final_grade } = req.body;

        // Verify user is faculty
        const faculty = await Faculty.findOne({ where: { user_id: userId } });
        if (!faculty) {
            throw ApiError.forbidden('Sadece akademisyenler not girebilir');
        }

        const enrollment = await GradeService.enterGrades(
            enrollment_id,
            { midterm_grade, final_grade },
            userId
        );

        res.json({
            success: true,
            message: 'Not başarıyla girildi',
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk enter grades (Faculty only)
 */
const bulkEnterGrades = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { grades } = req.body; // Array of { enrollment_id, midterm_grade, final_grade }

        const faculty = await Faculty.findOne({ where: { user_id: userId } });
        if (!faculty) {
            throw ApiError.forbidden('Sadece akademisyenler not girebilir');
        }

        const results = [];
        const errors = [];

        for (const grade of grades) {
            try {
                const enrollment = await GradeService.enterGrades(
                    grade.enrollment_id,
                    { midterm_grade: grade.midterm_grade, final_grade: grade.final_grade },
                    userId
                );
                results.push({ enrollment_id: grade.enrollment_id, success: true });
            } catch (error) {
                errors.push({ enrollment_id: grade.enrollment_id, error: error.message });
            }
        }

        res.json({
            success: true,
            message: `${results.length} not girildi, ${errors.length} hata`,
            data: { results, errors }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate HTML transcript
 */
function generateTranscriptHtml(transcript) {
    const semesterRows = transcript.semesters.map(sem => `
        <tr class="semester-header">
            <td colspan="5"><strong>${sem.year} - ${sem.semester.toUpperCase()}</strong> (GPA: ${sem.gpa})</td>
        </tr>
        ${sem.courses.map(c => `
            <tr>
                <td>${c.code}</td>
                <td>${c.name}</td>
                <td>${c.credits}</td>
                <td>${c.letterGrade || '-'}</td>
                <td>${c.gradePoint !== null ? c.gradePoint.toFixed(2) : '-'}</td>
            </tr>
        `).join('')}
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Transcript - ${transcript.student.firstName} ${transcript.student.lastName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .student-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4a5568; color: white; }
        .semester-header { background-color: #e2e8f0; }
        .cgpa { font-size: 18px; margin-top: 20px; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <h1>📜 Academic Transcript</h1>
    <h2>Smart Campus University</h2>
    
    <div class="student-info">
        <p><strong>Student:</strong> ${transcript.student.firstName} ${transcript.student.lastName}</p>
        <p><strong>Student Number:</strong> ${transcript.student.studentNumber}</p>
        <p><strong>Department:</strong> ${transcript.student.department}</p>
        <p><strong>Enrollment Year:</strong> ${transcript.student.enrollmentYear}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Grade</th>
                <th>Points</th>
            </tr>
        </thead>
        <tbody>
            ${semesterRows}
        </tbody>
    </table>

    <p class="cgpa">Cumulative GPA (CGPA): ${transcript.cgpa}</p>
    
    <div class="footer">
        <p>Generated: ${new Date(transcript.generatedAt).toLocaleString()}</p>
        <p>This is an official document from Smart Campus University.</p>
    </div>
</body>
</html>
    `;
}

module.exports = {
    getMyGrades,
    getTranscript,
    getTranscriptPdf,
    enterGrades,
    bulkEnterGrades
};

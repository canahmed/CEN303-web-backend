const PDFDocument = require('pdfkit');

/**
 * PDFService - Generate professional PDF documents
 */
class PDFService {
    /**
     * Generate a professional transcript PDF
     * @param {Object} transcriptData - Transcript data from GradeService
     * @returns {Promise<Buffer>} - PDF buffer
     */
    static async generateTranscriptPdf(transcriptData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 }
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });

                // Header
                this.drawHeader(doc, transcriptData);

                // Student Info
                this.drawStudentInfo(doc, transcriptData.student);

                // Semester Grades
                this.drawSemesterGrades(doc, transcriptData.semesters);

                // Summary
                this.drawSummary(doc, transcriptData);

                // Footer
                this.drawFooter(doc);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Draw document header
     */
    static drawHeader(doc, data) {
        // University Name
        doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#1a365d')
            .text('SMART CAMPUS UNIVERSITY', { align: 'center' });

        doc.fontSize(14)
            .font('Helvetica')
            .fillColor('#2d3748')
            .text('Official Academic Transcript', { align: 'center' });

        doc.moveDown(0.5);

        // Divider line
        doc.strokeColor('#3182ce')
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(1);
    }

    /**
     * Draw student information section
     */
    static drawStudentInfo(doc, student) {
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#1a365d')
            .text('STUDENT INFORMATION');

        doc.moveDown(0.3);

        const infoY = doc.y;
        const col1X = 50;
        const col2X = 300;

        doc.fontSize(10).font('Helvetica').fillColor('#4a5568');

        // Left column
        doc.text(`Student Name:`, col1X, infoY)
            .font('Helvetica-Bold')
            .text(`${student.firstName} ${student.lastName}`, col1X + 90, infoY);

        doc.font('Helvetica')
            .text(`Student Number:`, col1X, infoY + 15)
            .font('Helvetica-Bold')
            .text(`${student.studentNumber}`, col1X + 90, infoY + 15);

        doc.font('Helvetica')
            .text(`Email:`, col1X, infoY + 30)
            .font('Helvetica-Bold')
            .text(`${student.email}`, col1X + 90, infoY + 30);

        // Right column
        doc.font('Helvetica')
            .text(`Department:`, col2X, infoY)
            .font('Helvetica-Bold')
            .text(`${student.department || 'N/A'}`, col2X + 80, infoY);

        doc.font('Helvetica')
            .text(`Enrollment Year:`, col2X, infoY + 15)
            .font('Helvetica-Bold')
            .text(`${student.enrollmentYear}`, col2X + 80, infoY + 15);

        doc.moveDown(3);

        // Divider
        doc.strokeColor('#e2e8f0')
            .lineWidth(1)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(1);
    }

    /**
     * Draw semester grades table
     */
    static drawSemesterGrades(doc, semesters) {
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#1a365d')
            .text('ACADEMIC RECORD');

        doc.moveDown(0.5);

        for (const semester of semesters) {
            // Check if we need a new page
            if (doc.y > 680) {
                doc.addPage();
            }

            // Semester header
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#2b6cb0')
                .text(`${semester.year} - ${semester.semester.toUpperCase()} (GPA: ${semester.gpa.toFixed(2)})`);

            doc.moveDown(0.3);

            // Table header
            const tableTop = doc.y;
            const col = { code: 50, name: 120, credits: 350, grade: 420, points: 480 };

            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#4a5568')
                .text('Code', col.code, tableTop)
                .text('Course Name', col.name, tableTop)
                .text('Credits', col.credits, tableTop)
                .text('Grade', col.grade, tableTop)
                .text('Points', col.points, tableTop);

            // Table header line
            doc.strokeColor('#cbd5e0')
                .lineWidth(0.5)
                .moveTo(50, tableTop + 12)
                .lineTo(545, tableTop + 12)
                .stroke();

            let rowY = tableTop + 18;

            // Course rows
            for (const course of semester.courses) {
                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor('#2d3748')
                    .text(course.code, col.code, rowY)
                    .text(course.name.substring(0, 30), col.name, rowY)
                    .text(course.credits.toString(), col.credits, rowY)
                    .text(course.letterGrade || '-', col.grade, rowY)
                    .text(course.gradePoint !== null ? course.gradePoint.toFixed(2) : '-', col.points, rowY);

                rowY += 14;
            }

            doc.moveDown(2);
        }
    }

    /**
     * Draw summary section
     */
    static drawSummary(doc, transcriptData) {
        // Check if we need a new page
        if (doc.y > 700) {
            doc.addPage();
        }

        doc.moveDown(1);

        // Divider
        doc.strokeColor('#3182ce')
            .lineWidth(1)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(0.5);

        // CGPA Box
        doc.rect(380, doc.y, 165, 40)
            .fill('#ebf8ff');

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2b6cb0')
            .text('Cumulative GPA (CGPA)', 390, doc.y + 8);

        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#1a365d')
            .text(transcriptData.cgpa.toFixed(2), 430, doc.y + 22);

        doc.moveDown(3);
    }

    /**
     * Draw footer
     */
    static drawFooter(doc) {
        const pageHeight = 841.89; // A4 height in points

        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#718096');

        doc.text(
            'This is an official document from Smart Campus University.',
            50,
            pageHeight - 60,
            { align: 'center' }
        );

        doc.text(
            `Generated on: ${new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`,
            50,
            pageHeight - 48,
            { align: 'center' }
        );

        doc.text(
            'Document ID: ' + this.generateDocumentId(),
            50,
            pageHeight - 36,
            { align: 'center' }
        );
    }

    /**
     * Generate a unique document ID
     */
    static generateDocumentId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `TR-${timestamp}-${random}`;
    }
}

module.exports = PDFService;

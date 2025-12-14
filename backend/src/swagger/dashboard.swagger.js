/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Rol bazli dashboard ozetleri
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Rol bazli dashboard verileri
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Basarili istek
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/StudentDashboard'
 *                     - $ref: '#/components/schemas/FacultyDashboard'
 *                     - $ref: '#/components/schemas/AdminDashboard'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardClass:
 *       type: object
 *       properties:
 *         courseCode:
 *           type: string
 *           example: CSE101
 *         courseName:
 *           type: string
 *           example: Programlamaya Giris
 *         sectionNumber:
 *           type: string
 *           example: "01"
 *         day:
 *           type: string
 *           example: Monday
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "10:30"
 *         classroom:
 *           type: string
 *           example: Muhendislik A-101
 *         status:
 *           type: string
 *           example: upcoming
 *         nextDate:
 *           type: string
 *           format: date-time
 *           example: "2025-02-01T09:00:00.000Z"
 *
 *     DashboardGrade:
 *       type: object
 *       properties:
 *         courseCode:
 *           type: string
 *         courseName:
 *           type: string
 *         sectionNumber:
 *           type: string
 *         midterm:
 *           type: number
 *           nullable: true
 *         final:
 *           type: number
 *           nullable: true
 *         letter:
 *           type: string
 *           nullable: true
 *         gradePoint:
 *           type: number
 *           nullable: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     DashboardActivity:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           example: user
 *         title:
 *           type: string
 *         detail:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *
 *     StudentDashboard:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           example: student
 *         summary:
 *           type: object
 *           properties:
 *             registeredCourses:
 *               type: integer
 *               example: 5
 *             gpa:
 *               type: number
 *               example: 3.4
 *             cgpa:
 *               type: number
 *               example: 3.25
 *             attendanceRate:
 *               type: number
 *               example: 92
 *             todayCourseCount:
 *               type: integer
 *               example: 2
 *         todayClasses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardClass'
 *         recentGrades:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardGrade'
 *
 *     FacultyDashboard:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           example: faculty
 *         summary:
 *           type: object
 *           properties:
 *             sectionCount:
 *               type: integer
 *               example: 3
 *             studentCount:
 *               type: integer
 *               example: 120
 *             pendingGrades:
 *               type: integer
 *               example: 8
 *             pendingExcuses:
 *               type: integer
 *               example: 2
 *             activeSessions:
 *               type: integer
 *               example: 1
 *             upcomingClassCount:
 *               type: integer
 *               example: 4
 *         upcomingSessions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardClass'
 *         pendingActions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               value:
 *                 type: integer
 *
 *     AdminDashboard:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           example: admin
 *         summary:
 *           type: object
 *           properties:
 *             totalStudents:
 *               type: integer
 *               example: 2500
 *             facultyCount:
 *               type: integer
 *               example: 180
 *             activeCourses:
 *               type: integer
 *               example: 320
 *             activeSections:
 *               type: integer
 *               example: 540
 *             totalUsers:
 *               type: integer
 *               example: 2800
 *         systemStatus:
 *           type: object
 *           properties:
 *             api:
 *               type: string
 *               example: online
 *             database:
 *               type: string
 *               example: connected
 *             checkedAt:
 *               type: string
 *               format: date-time
 *             uptimeSeconds:
 *               type: integer
 *         recentActivities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DashboardActivity'
 */

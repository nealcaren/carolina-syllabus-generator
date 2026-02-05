/**
 * Syllabus Builder Module
 * Manages the syllabus data model and generates output
 */

const SyllabusBuilder = (function() {
    // Syllabus data model
    let syllabusData = {
        course: null,
        courseObjectives: [],
        genedOutcomes: [],
        confirmedGeneds: [],
        gradeScale: 'standard',
        customScaleText: '',
        assignments: [],
        attendancePolicy: '',
        materials: [],
        additionalMaterials: '',
        includeDiversity: true,
        includeCompliance: false,
        customStatements: ''
    };

    // Standard UNC grade scale
    const standardGradeScale = [
        { grade: 'A', min: 93 },
        { grade: 'A-', min: 90 },
        { grade: 'B+', min: 87 },
        { grade: 'B', min: 83 },
        { grade: 'B-', min: 80 },
        { grade: 'C+', min: 77 },
        { grade: 'C', min: 73 },
        { grade: 'C-', min: 70 },
        { grade: 'D+', min: 67 },
        { grade: 'D', min: 60 },
        { grade: 'F', min: 0 }
    ];

    const letterGradeScale = [
        { grade: 'A', min: 90 },
        { grade: 'B', min: 80 },
        { grade: 'C', min: 70 },
        { grade: 'D', min: 60 },
        { grade: 'F', min: 0 }
    ];

    /**
     * Set course information
     * @param {Object} course - Course data
     */
    function setCourse(course) {
        syllabusData.course = course;
        syllabusData.genedOutcomes = course.genedDetails || [];
    }

    /**
     * Update a field in the syllabus data
     * @param {string} field - Field name
     * @param {*} value - Field value
     */
    function updateField(field, value) {
        if (field in syllabusData) {
            syllabusData[field] = value;
        }
    }

    /**
     * Get the current syllabus data
     * @returns {Object} Syllabus data
     */
    function getData() {
        return { ...syllabusData };
    }

    /**
     * Get grade scale text based on selected type
     * @returns {string} Grade scale text
     */
    function getGradeScaleText() {
        switch (syllabusData.gradeScale) {
            case 'standard':
                return standardGradeScale
                    .map(g => `${g.grade}: ${g.min}${g.min > 0 ? '+' : ''}`)
                    .join(', ');
            case 'letter':
                return letterGradeScale
                    .map(g => `${g.grade}: ${g.min}${g.min > 0 ? '+' : ''}`)
                    .join(', ');
            case 'plusminus':
                return syllabusData.customScaleText || 'Custom scale not specified';
            default:
                return '';
        }
    }

    /**
     * Generate Markdown output
     * @returns {string} Markdown content
     */
    function generateMarkdown() {
        const course = syllabusData.course;
        if (!course) return 'No course selected';

        let md = '';

        // Title
        md += `# ${course.prefix} ${course.number}: ${course.title}\n\n`;

        // Course Description
        md += `## Course Description\n\n`;
        md += `${course.description}\n\n`;
        md += `**Credits:** ${course.credits}\n\n`;

        // Student Learning Outcomes
        md += `## Student Learning Outcomes\n\n`;

        // Course Objectives
        if (syllabusData.courseObjectives.length > 0) {
            md += `### Course Learning Objectives\n\n`;
            md += `By the end of this course, students will be able to:\n\n`;
            for (const objective of syllabusData.courseObjectives) {
                md += `- ${objective}\n`;
            }
            md += '\n';
        }

        // Gen Ed Outcomes (use confirmed gen eds, or fall back to all)
        const genedsToUse = syllabusData.confirmedGeneds.length > 0
            ? syllabusData.confirmedGeneds
            : syllabusData.genedOutcomes;

        for (const gened of genedsToUse) {
            md += `### ${gened.name} Learning Outcomes\n\n`;
            for (const outcome of gened.outcomes) {
                md += `- ${outcome}\n`;
            }
            md += '\n';
        }

        // Grading
        md += `## Grading\n\n`;
        md += `### Grade Scale\n\n`;
        md += `${getGradeScaleText()}\n\n`;

        if (syllabusData.assignments.length > 0) {
            md += `### Grade Breakdown\n\n`;
            md += `| Assignment | Percentage |\n`;
            md += `|------------|------------|\n`;
            for (const assignment of syllabusData.assignments) {
                if (assignment.name && assignment.percentage) {
                    md += `| ${assignment.name} | ${assignment.percentage}% |\n`;
                }
            }
            md += '\n';
        }

        if (syllabusData.attendancePolicy.trim()) {
            md += `### Attendance and Participation\n\n`;
            md += `${syllabusData.attendancePolicy}\n\n`;
        }

        // Required Materials
        md += `## Required Materials\n\n`;
        const hasRequiredMaterials = syllabusData.materials.some(m => m.title);

        if (hasRequiredMaterials || syllabusData.additionalMaterials.trim()) {
            for (const material of syllabusData.materials) {
                if (material.title) {
                    let entry = `- **${material.title}**`;
                    if (material.author) entry += ` by ${material.author}`;
                    if (material.publisher || material.edition) {
                        const pubInfo = [material.publisher, material.edition].filter(Boolean).join(', ');
                        entry += ` (${pubInfo})`;
                    }
                    if (material.isbn) entry += ` ISBN: ${material.isbn}`;
                    md += entry + '\n';
                }
            }

            if (syllabusData.additionalMaterials.trim()) {
                md += `\n### Additional Materials\n\n`;
                md += `${syllabusData.additionalMaterials}\n`;
            }
            md += '\n';
        } else {
            md += `Students are not required to purchase any course materials.\n\n`;
        }

        // Custom Statements
        if (syllabusData.customStatements.trim()) {
            md += `## Course Policies\n\n`;
            md += `${syllabusData.customStatements}\n\n`;
        }

        // Diversity Statement
        if (syllabusData.includeDiversity) {
            md += `---\n\n`;
            md += `*The course engages diverse scholarly perspectives to develop critical thinking, analysis, and debate, and inclusion of a reading does not imply endorsement.*\n\n`;
        }

        // Compliance Statement
        if (syllabusData.includeCompliance) {
            md += `*This syllabus has been prepared in compliance with UNC System Policy. The university respects the professor's expertise and discretion in course design, including the selection of course materials based on their academic merit. The readings and materials in this course have been chosen for their scholarly value in achieving the educational objectives described above.*\n`;
        }

        return md;
    }

    /**
     * Generate HTML preview
     * @returns {string} HTML content
     */
    function generateHTML() {
        const course = syllabusData.course;
        if (!course) return '<p>No course selected</p>';

        let html = '';

        // Title
        html += `<h1>${course.prefix} ${course.number}: ${course.title}</h1>`;

        // Course Description
        html += `<h2>Course Description</h2>`;
        html += `<p>${course.description}</p>`;
        html += `<p><strong>Credits:</strong> ${course.credits}</p>`;

        // Student Learning Outcomes
        html += `<h2>Student Learning Outcomes</h2>`;

        // Course Objectives
        if (syllabusData.courseObjectives.length > 0) {
            html += `<h3>Course Learning Objectives</h3>`;
            html += `<p>By the end of this course, students will be able to:</p>`;
            html += `<ul>`;
            for (const objective of syllabusData.courseObjectives) {
                html += `<li>${objective}</li>`;
            }
            html += `</ul>`;
        }

        // Gen Ed Outcomes (use confirmed gen eds, or fall back to all)
        const genedsForHtml = syllabusData.confirmedGeneds.length > 0
            ? syllabusData.confirmedGeneds
            : syllabusData.genedOutcomes;

        for (const gened of genedsForHtml) {
            html += `<h3>${gened.name} Learning Outcomes</h3>`;
            html += `<ul>`;
            for (const outcome of gened.outcomes) {
                html += `<li>${outcome}</li>`;
            }
            html += `</ul>`;
        }

        // Grading
        html += `<h2>Grading</h2>`;
        html += `<h3>Grade Scale</h3>`;
        html += `<p>${getGradeScaleText()}</p>`;

        if (syllabusData.assignments.length > 0) {
            html += `<h3>Grade Breakdown</h3>`;
            html += `<table><thead><tr><th>Assignment</th><th>Percentage</th></tr></thead><tbody>`;
            for (const assignment of syllabusData.assignments) {
                if (assignment.name && assignment.percentage) {
                    html += `<tr><td>${assignment.name}</td><td>${assignment.percentage}%</td></tr>`;
                }
            }
            html += `</tbody></table>`;
        }

        if (syllabusData.attendancePolicy.trim()) {
            html += `<h3>Attendance and Participation</h3>`;
            html += `<p>${formatTextToHTML(syllabusData.attendancePolicy)}</p>`;
        }

        // Required Materials
        html += `<h2>Required Materials</h2>`;
        const hasRequiredMaterialsHtml = syllabusData.materials.some(m => m.title);

        if (hasRequiredMaterialsHtml || syllabusData.additionalMaterials.trim()) {
            if (hasRequiredMaterialsHtml) {
                html += `<ul>`;
                for (const material of syllabusData.materials) {
                    if (material.title) {
                        let entry = `<strong>${material.title}</strong>`;
                        if (material.author) entry += ` by ${material.author}`;
                        if (material.publisher || material.edition) {
                            const pubInfo = [material.publisher, material.edition].filter(Boolean).join(', ');
                            entry += ` (${pubInfo})`;
                        }
                        if (material.isbn) entry += ` ISBN: ${material.isbn}`;
                        html += `<li>${entry}</li>`;
                    }
                }
                html += `</ul>`;
            }

            if (syllabusData.additionalMaterials.trim()) {
                html += `<h3>Additional Materials</h3>`;
                html += `<p>${formatTextToHTML(syllabusData.additionalMaterials)}</p>`;
            }
        } else {
            html += `<p>Students are not required to purchase any course materials.</p>`;
        }

        // Custom Statements
        if (syllabusData.customStatements.trim()) {
            html += `<h2>Course Policies</h2>`;
            html += `<p>${formatTextToHTML(syllabusData.customStatements)}</p>`;
        }

        // Diversity Statement
        if (syllabusData.includeDiversity) {
            html += `<hr>`;
            html += `<p><em>The course engages diverse scholarly perspectives to develop critical thinking, analysis, and debate, and inclusion of a reading does not imply endorsement.</em></p>`;
        }

        // Compliance Statement
        if (syllabusData.includeCompliance) {
            html += `<p><em>This syllabus has been prepared in compliance with UNC System Policy. The university respects the professor's expertise and discretion in course design, including the selection of course materials based on their academic merit. The readings and materials in this course have been chosen for their scholarly value in achieving the educational objectives described above.</em></p>`;
        }

        return html;
    }

    /**
     * Format plain text to HTML (handle newlines and bullets)
     * @param {string} text - Plain text
     * @returns {string} HTML formatted text
     */
    function formatTextToHTML(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/•/g, '&bull;');
    }

    /**
     * Reset syllabus data
     */
    function reset() {
        syllabusData = {
            course: null,
            courseObjectives: [],
            genedOutcomes: [],
            confirmedGeneds: [],
            gradeScale: 'standard',
            customScaleText: '',
            assignments: [],
            attendancePolicy: '',
            materials: [],
            additionalMaterials: '',
            includeDiversity: true,
            includeCompliance: false,
            customStatements: ''
        };
    }

    return {
        setCourse,
        updateField,
        getData,
        generateMarkdown,
        generateHTML,
        reset
    };
})();

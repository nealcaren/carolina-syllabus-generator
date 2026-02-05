/**
 * Export Module
 * Handles exporting syllabus to various formats
 */

const Export = (function() {
    // Load docx.js from CDN
    let docxLoaded = false;

    /**
     * Initialize export module (load docx library)
     */
    async function init() {
        if (!docxLoaded && typeof docx === 'undefined') {
            try {
                await loadScript('https://unpkg.com/docx@8.5.0/build/index.js');
                docxLoaded = true;
            } catch (error) {
                console.error('Failed to load docx library:', error);
            }
        }
    }

    /**
     * Load a script dynamically
     * @param {string} src - Script URL
     * @returns {Promise}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Copy markdown to clipboard
     * @param {string} markdown - Markdown content
     * @returns {Promise<boolean>} Success status
     */
    async function copyMarkdown(markdown) {
        try {
            await navigator.clipboard.writeText(markdown);
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = markdown;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (e) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * Generate and download Word document
     * @param {Object} syllabusData - Syllabus data from SyllabusBuilder
     */
    async function downloadWord(syllabusData) {
        await init();

        if (typeof docx === 'undefined') {
            alert('Word export is not available. Please try copying the Markdown instead.');
            return;
        }

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = docx;

        const course = syllabusData.course;
        if (!course) {
            alert('No course selected');
            return;
        }

        const children = [];

        // Title
        children.push(
            new Paragraph({
                text: `${course.prefix} ${course.number}: ${course.title}`,
                heading: HeadingLevel.TITLE
            })
        );

        // Course Description
        children.push(
            new Paragraph({
                text: 'Course Description',
                heading: HeadingLevel.HEADING_1
            })
        );
        children.push(
            new Paragraph({ text: course.description })
        );
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Credits: ', bold: true }),
                    new TextRun({ text: String(course.credits) })
                ]
            })
        );
        children.push(new Paragraph({ text: '' }));

        // Student Learning Outcomes
        children.push(
            new Paragraph({
                text: 'Student Learning Outcomes',
                heading: HeadingLevel.HEADING_1
            })
        );

        // Course Objectives
        if (syllabusData.courseObjectives && syllabusData.courseObjectives.length > 0) {
            children.push(
                new Paragraph({
                    text: 'Course Learning Objectives',
                    heading: HeadingLevel.HEADING_2
                })
            );
            children.push(
                new Paragraph({ text: 'By the end of this course, students will be able to:' })
            );
            for (const objective of syllabusData.courseObjectives) {
                children.push(
                    new Paragraph({
                        text: objective,
                        bullet: { level: 0 }
                    })
                );
            }
            children.push(new Paragraph({ text: '' }));
        }

        // Gen Ed Outcomes (use confirmed gen eds, or fall back to all)
        const genedsForWord = (syllabusData.confirmedGeneds && syllabusData.confirmedGeneds.length > 0)
            ? syllabusData.confirmedGeneds
            : syllabusData.genedOutcomes;

        for (const gened of genedsForWord) {
            children.push(
                new Paragraph({
                    text: `${gened.name} Learning Outcomes`,
                    heading: HeadingLevel.HEADING_2
                })
            );
            for (const outcome of gened.outcomes) {
                children.push(
                    new Paragraph({
                        text: outcome,
                        bullet: { level: 0 }
                    })
                );
            }
            children.push(new Paragraph({ text: '' }));
        }

        // Grading
        children.push(
            new Paragraph({
                text: 'Grading',
                heading: HeadingLevel.HEADING_1
            })
        );

        children.push(
            new Paragraph({
                text: 'Grade Scale',
                heading: HeadingLevel.HEADING_2
            })
        );

        // Get grade scale text
        let gradeScaleText = '';
        if (syllabusData.gradeScale === 'standard') {
            gradeScaleText = 'A: 93+, A-: 90+, B+: 87+, B: 83+, B-: 80+, C+: 77+, C: 73+, C-: 70+, D+: 67+, D: 60+, F: Below 60';
        } else if (syllabusData.gradeScale === 'letter') {
            gradeScaleText = 'A: 90+, B: 80+, C: 70+, D: 60+, F: Below 60';
        } else {
            gradeScaleText = syllabusData.customScaleText || 'Custom scale';
        }
        children.push(new Paragraph({ text: gradeScaleText }));
        children.push(new Paragraph({ text: '' }));

        // Assignment Table
        if (syllabusData.assignments.length > 0) {
            children.push(
                new Paragraph({
                    text: 'Grade Breakdown',
                    heading: HeadingLevel.HEADING_2
                })
            );

            const tableRows = [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: 'Assignment', bold: true })] })],
                            width: { size: 70, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: 'Percentage', bold: true })] })],
                            width: { size: 30, type: WidthType.PERCENTAGE }
                        })
                    ]
                })
            ];

            for (const assignment of syllabusData.assignments) {
                if (assignment.name && assignment.percentage) {
                    tableRows.push(
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ text: assignment.name })]
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: `${assignment.percentage}%` })]
                                })
                            ]
                        })
                    );
                }
            }

            children.push(
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE }
                })
            );
            children.push(new Paragraph({ text: '' }));
        }

        // Attendance Policy
        if (syllabusData.attendancePolicy.trim()) {
            children.push(
                new Paragraph({
                    text: 'Attendance and Participation',
                    heading: HeadingLevel.HEADING_2
                })
            );
            const attendanceLines = syllabusData.attendancePolicy.split('\n');
            for (const line of attendanceLines) {
                if (line.trim()) {
                    children.push(new Paragraph({ text: line }));
                }
            }
            children.push(new Paragraph({ text: '' }));
        }

        // Required Materials
        children.push(
            new Paragraph({
                text: 'Required Materials',
                heading: HeadingLevel.HEADING_1
            })
        );

        const hasRequiredMaterialsWord = syllabusData.materials.some(m => m.title);

        if (hasRequiredMaterialsWord || syllabusData.additionalMaterials.trim()) {
            for (const material of syllabusData.materials) {
                if (material.title) {
                    let text = material.title;
                    if (material.author) text += ` by ${material.author}`;
                    if (material.publisher || material.edition) {
                        const pubInfo = [material.publisher, material.edition].filter(Boolean).join(', ');
                        text += ` (${pubInfo})`;
                    }
                    if (material.isbn) text += ` ISBN: ${material.isbn}`;

                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: material.title, bold: true }),
                                new TextRun({ text: text.substring(material.title.length) })
                            ],
                            bullet: { level: 0 }
                        })
                    );
                }
            }

            if (syllabusData.additionalMaterials.trim()) {
                children.push(
                    new Paragraph({
                        text: 'Additional Materials',
                        heading: HeadingLevel.HEADING_2
                    })
                );
                children.push(new Paragraph({ text: syllabusData.additionalMaterials }));
            }
        } else {
            children.push(new Paragraph({ text: 'Students are not required to purchase any course materials.' }));
        }
        children.push(new Paragraph({ text: '' }));

        // Custom Statements
        if (syllabusData.customStatements.trim()) {
            children.push(
                new Paragraph({
                    text: 'Course Policies',
                    heading: HeadingLevel.HEADING_1
                })
            );
            const statementLines = syllabusData.customStatements.split('\n');
            for (const line of statementLines) {
                if (line.trim()) {
                    children.push(new Paragraph({ text: line }));
                }
            }
            children.push(new Paragraph({ text: '' }));
        }

        // Diversity Statement
        if (syllabusData.diversityStatement && syllabusData.diversityStatement.trim()) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: syllabusData.diversityStatement,
                            italics: true
                        })
                    ]
                })
            );
        }

        // Compliance Statement
        if (syllabusData.includeCompliance) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'This syllabus has been prepared in compliance with UNC System Policy. The university respects the professor\'s expertise and discretion in course design, including the selection of course materials based on their academic merit. The readings and materials in this course have been chosen for their scholarly value in achieving the educational objectives described above.',
                            italics: true
                        })
                    ]
                })
            );
        }

        // Create document
        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });

        // Generate and download
        const blob = await Packer.toBlob(doc);
        const filename = `${course.prefix}${course.number}_Syllabus.docx`;
        downloadBlob(blob, filename);
    }

    /**
     * Download a blob as a file
     * @param {Blob} blob - File blob
     * @param {string} filename - Filename
     */
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return {
        init,
        copyMarkdown,
        downloadWord
    };
})();

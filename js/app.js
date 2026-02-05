/**
 * UNC Syllabus Generator - Main Application
 * Coordinates all modules and handles user interactions
 */

(function() {
    'use strict';

    // DOM element references
    const elements = {
        // Course details
        courseDetails: document.getElementById('course-details'),
        coursePrefix: document.getElementById('course-prefix'),
        courseNumber: document.getElementById('course-number'),
        courseTitle: document.getElementById('course-title'),
        courseCredits: document.getElementById('course-credits'),
        courseDescription: document.getElementById('course-description'),
        genedBadges: document.getElementById('gened-badges'),

        // Learning outcomes
        objectivesList: document.getElementById('objectives-list'),
        addObjectiveBtn: document.getElementById('add-objective'),
        objectiveTemplate: document.getElementById('objective-template'),
        genedOutcomesContainer: document.getElementById('gened-outcomes-container'),

        // Grading
        gradeScaleRadios: document.querySelectorAll('input[name="grade-scale"]'),
        customScale: document.getElementById('custom-scale'),
        customScaleInput: document.getElementById('custom-scale-input'),
        assignmentTbody: document.getElementById('assignment-tbody'),
        totalPercentage: document.getElementById('total-percentage'),
        addAssignmentBtn: document.getElementById('add-assignment'),
        attendancePolicy: document.getElementById('attendance-policy'),

        // Materials
        materialsList: document.getElementById('materials-list'),
        addMaterialBtn: document.getElementById('add-material'),
        additionalMaterials: document.getElementById('additional-materials'),
        materialTemplate: document.getElementById('material-template'),

        // Statements
        includeDiversity: document.getElementById('include-diversity'),
        includeCompliance: document.getElementById('include-compliance'),
        diversityPreview: document.getElementById('diversity-statement-preview'),
        compliancePreview: document.getElementById('compliance-statement-preview'),
        customStatements: document.getElementById('custom-statements'),

        // Export
        syllabusPreview: document.getElementById('syllabus-preview'),
        copyMarkdownBtn: document.getElementById('copy-markdown'),
        downloadWordBtn: document.getElementById('download-word')
    };

    /**
     * Initialize the application
     */
    async function init() {
        // Initialize modules
        await CourseLookup.init(handleCourseSelect);
        FormWizard.init(handleStepChange);
        await Export.init();

        // Set up event listeners
        setupEventListeners();

        // Add initial assignment row
        addAssignmentRow();

        // Load any saved draft from localStorage
        loadDraft();
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Grade scale selection
        elements.gradeScaleRadios.forEach(radio => {
            radio.addEventListener('change', handleGradeScaleChange);
        });

        // Custom scale input
        if (elements.customScaleInput) {
            elements.customScaleInput.addEventListener('input', () => {
                SyllabusBuilder.updateField('customScaleText', elements.customScaleInput.value);
                saveDraft();
            });
        }

        // Add objective button
        elements.addObjectiveBtn.addEventListener('click', addObjectiveRow);

        // Add assignment button
        elements.addAssignmentBtn.addEventListener('click', addAssignmentRow);

        // Add material button
        elements.addMaterialBtn.addEventListener('click', addMaterialRow);

        // Attendance policy
        elements.attendancePolicy.addEventListener('input', () => {
            SyllabusBuilder.updateField('attendancePolicy', elements.attendancePolicy.value);
            saveDraft();
        });

        // Additional materials
        elements.additionalMaterials.addEventListener('input', () => {
            SyllabusBuilder.updateField('additionalMaterials', elements.additionalMaterials.value);
            saveDraft();
        });

        // Diversity statement checkbox
        elements.includeDiversity.addEventListener('change', () => {
            SyllabusBuilder.updateField('includeDiversity', elements.includeDiversity.checked);
            elements.diversityPreview.classList.toggle('hidden', !elements.includeDiversity.checked);
            saveDraft();
        });

        // Compliance statement checkbox
        elements.includeCompliance.addEventListener('change', () => {
            SyllabusBuilder.updateField('includeCompliance', elements.includeCompliance.checked);
            elements.compliancePreview.classList.toggle('hidden', !elements.includeCompliance.checked);
            saveDraft();
        });

        // Custom statements
        elements.customStatements.addEventListener('input', () => {
            SyllabusBuilder.updateField('customStatements', elements.customStatements.value);
            saveDraft();
        });

        // Export buttons
        elements.copyMarkdownBtn.addEventListener('click', handleCopyMarkdown);
        elements.downloadWordBtn.addEventListener('click', handleDownloadWord);
    }

    /**
     * Handle course selection from search
     * @param {Object} course - Selected course data
     */
    function handleCourseSelect(course) {
        // Update syllabus builder
        SyllabusBuilder.setCourse(course);

        // Populate course details
        elements.courseDetails.classList.remove('hidden');
        elements.coursePrefix.value = course.prefix;
        elements.courseNumber.value = course.number;
        elements.courseTitle.value = course.title;
        elements.courseCredits.value = course.credits;
        elements.courseDescription.value = course.description;

        // Populate gen ed badges
        elements.genedBadges.innerHTML = course.geneds.map(code =>
            `<span class="gened-badge">${code}</span>`
        ).join('');

        // Populate gen ed outcomes in step 2
        populateGenedOutcomes(course.genedDetails);

        saveDraft();
    }

    /**
     * Populate gen ed outcomes section with checkboxes for confirmation
     * @param {Array} geneds - Gen ed details
     */
    function populateGenedOutcomes(geneds) {
        if (!geneds || geneds.length === 0) {
            elements.genedOutcomesContainer.innerHTML = '<p class="no-geneds">No general education requirements listed for this course.</p>';
            return;
        }

        elements.genedOutcomesContainer.innerHTML = geneds.map(gened => `
            <div class="gened-outcome-section" data-gened-code="${gened.code}">
                <label class="gened-checkbox">
                    <input type="checkbox" class="gened-confirm" data-code="${gened.code}" checked>
                    <span class="gened-title">${gened.name} (${gened.code})</span>
                </label>
                <ul>
                    ${gened.outcomes.map(outcome => `<li>${outcome}</li>`).join('')}
                </ul>
            </div>
        `).join('');

        // Add event listeners for checkboxes
        elements.genedOutcomesContainer.querySelectorAll('.gened-confirm').forEach(checkbox => {
            checkbox.addEventListener('change', updateConfirmedGeneds);
        });

        // Initialize confirmed gen eds
        updateConfirmedGeneds();
    }

    /**
     * Update which gen eds are confirmed based on checkboxes
     */
    function updateConfirmedGeneds() {
        const confirmed = [];
        elements.genedOutcomesContainer.querySelectorAll('.gened-confirm:checked').forEach(checkbox => {
            const code = checkbox.dataset.code;
            const section = checkbox.closest('.gened-outcome-section');
            const data = SyllabusBuilder.getData();

            // Find the full gened data
            if (data.genedOutcomes) {
                const gened = data.genedOutcomes.find(g => g.code === code);
                if (gened) {
                    confirmed.push(gened);
                }
            }

            // Visual feedback
            if (section) {
                section.classList.toggle('gened-disabled', !checkbox.checked);
            }
        });

        SyllabusBuilder.updateField('confirmedGeneds', confirmed);
        saveDraft();
    }

    /**
     * Handle step change in form wizard
     * @param {number} newStep - New step number
     * @param {number} previousStep - Previous step number
     */
    function handleStepChange(newStep, previousStep) {
        // Collect data from previous step
        collectStepData(previousStep);

        // If moving to preview step, update preview
        if (newStep === 6) {
            updatePreview();
        }

        saveDraft();
    }

    /**
     * Collect data from a specific step
     * @param {number} step - Step number
     */
    function collectStepData(step) {
        switch (step) {
            case 2:
                updateObjectives();
                break;
            case 3:
                collectGradingData();
                break;
            case 4:
                collectMaterialsData();
                break;
            case 5:
                SyllabusBuilder.updateField('includeDiversity', elements.includeDiversity.checked);
                SyllabusBuilder.updateField('includeCompliance', elements.includeCompliance.checked);
                SyllabusBuilder.updateField('customStatements', elements.customStatements.value);
                break;
        }
    }

    /**
     * Handle grade scale selection change
     */
    function handleGradeScaleChange(event) {
        const value = event.target.value;
        SyllabusBuilder.updateField('gradeScale', value);

        if (value === 'plusminus') {
            elements.customScale.classList.remove('hidden');
        } else {
            elements.customScale.classList.add('hidden');
        }

        saveDraft();
    }

    /**
     * Add a new objective row
     */
    function addObjectiveRow() {
        const template = elements.objectiveTemplate.content.cloneNode(true);
        const objectiveItem = template.querySelector('.objective-item');

        // Add event listener for input
        objectiveItem.querySelector('.objective-input').addEventListener('input', updateObjectives);

        // Add remove button listener
        objectiveItem.querySelector('.remove-objective').addEventListener('click', () => {
            objectiveItem.remove();
            updateObjectives();
        });

        elements.objectivesList.appendChild(objectiveItem);
    }

    /**
     * Update objectives data
     */
    function updateObjectives() {
        const items = elements.objectivesList.querySelectorAll('.objective-item');
        const objectives = [];

        items.forEach(item => {
            const text = item.querySelector('.objective-input').value.trim();
            if (text) {
                objectives.push(text);
            }
        });

        SyllabusBuilder.updateField('courseObjectives', objectives);
        saveDraft();
    }

    /**
     * Add a new assignment row
     */
    function addAssignmentRow() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="assignment-name" placeholder="e.g., Midterm Exam"></td>
            <td><input type="number" class="percentage-input" min="0" max="100" placeholder="0"></td>
            <td><button type="button" class="btn btn-remove remove-assignment">Remove</button></td>
        `;

        // Add event listeners
        row.querySelector('.assignment-name').addEventListener('input', updateAssignments);
        row.querySelector('.percentage-input').addEventListener('input', updateAssignments);
        row.querySelector('.remove-assignment').addEventListener('click', () => {
            row.remove();
            updateAssignments();
        });

        elements.assignmentTbody.appendChild(row);
    }

    /**
     * Update assignments data and total
     */
    function updateAssignments() {
        const rows = elements.assignmentTbody.querySelectorAll('tr');
        const assignments = [];
        let total = 0;

        rows.forEach(row => {
            const name = row.querySelector('.assignment-name').value;
            const percentage = parseFloat(row.querySelector('.percentage-input').value) || 0;

            if (name || percentage) {
                assignments.push({ name, percentage });
            }
            total += percentage;
        });

        SyllabusBuilder.updateField('assignments', assignments);

        // Update total display
        elements.totalPercentage.textContent = `${total}%`;
        elements.totalPercentage.classList.remove('error', 'success');
        if (total === 100) {
            elements.totalPercentage.classList.add('success');
        } else if (total !== 0) {
            elements.totalPercentage.classList.add('error');
        }

        saveDraft();
    }

    /**
     * Collect grading data from form
     */
    function collectGradingData() {
        const selectedScale = document.querySelector('input[name="grade-scale"]:checked');
        SyllabusBuilder.updateField('gradeScale', selectedScale ? selectedScale.value : 'standard');
        SyllabusBuilder.updateField('customScaleText', elements.customScaleInput.value);
        SyllabusBuilder.updateField('attendancePolicy', elements.attendancePolicy.value);
        updateAssignments();
    }

    /**
     * Add a new material row
     */
    function addMaterialRow() {
        const template = elements.materialTemplate.content.cloneNode(true);
        const materialItem = template.querySelector('.material-item');

        // Add event listeners for inputs
        materialItem.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', updateMaterials);
        });

        // Add remove button listener
        materialItem.querySelector('.remove-material').addEventListener('click', () => {
            materialItem.remove();
            updateMaterials();
        });

        elements.materialsList.appendChild(materialItem);
    }

    /**
     * Update materials data
     */
    function updateMaterials() {
        const items = elements.materialsList.querySelectorAll('.material-item');
        const materials = [];

        items.forEach(item => {
            const material = {
                title: item.querySelector('.material-title').value,
                author: item.querySelector('.material-author').value,
                publisher: item.querySelector('.material-publisher').value,
                edition: item.querySelector('.material-edition').value,
                isbn: item.querySelector('.material-isbn').value
            };

            if (material.title) {
                materials.push(material);
            }
        });

        SyllabusBuilder.updateField('materials', materials);
        saveDraft();
    }

    /**
     * Collect materials data from form
     */
    function collectMaterialsData() {
        updateMaterials();
        SyllabusBuilder.updateField('additionalMaterials', elements.additionalMaterials.value);
    }

    /**
     * Update syllabus preview
     */
    function updatePreview() {
        // Collect all data first
        for (let i = 1; i <= 5; i++) {
            collectStepData(i);
        }

        // Generate and display HTML preview
        const html = SyllabusBuilder.generateHTML();
        elements.syllabusPreview.innerHTML = html;
    }

    /**
     * Handle copy markdown button click
     */
    async function handleCopyMarkdown() {
        updatePreview();
        const markdown = SyllabusBuilder.generateMarkdown();
        const success = await Export.copyMarkdown(markdown);

        if (success) {
            showToast('Markdown copied to clipboard!', 'success');
        } else {
            showToast('Failed to copy to clipboard', 'error');
        }
    }

    /**
     * Handle download word button click
     */
    async function handleDownloadWord() {
        updatePreview();
        const data = SyllabusBuilder.getData();

        try {
            await Export.downloadWord(data);
            showToast('Word document downloaded!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to generate Word document', 'error');
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error)
     */
    function showToast(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create and show new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Save draft to localStorage
     */
    function saveDraft() {
        try {
            const data = SyllabusBuilder.getData();
            localStorage.setItem('syllabus-draft', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save draft:', error);
        }
    }

    /**
     * Load draft from localStorage
     */
    function loadDraft() {
        try {
            const saved = localStorage.getItem('syllabus-draft');
            if (!saved) return;

            const data = JSON.parse(saved);

            // Restore course data
            if (data.course) {
                SyllabusBuilder.setCourse(data.course);
                elements.courseDetails.classList.remove('hidden');
                elements.coursePrefix.value = data.course.prefix || '';
                elements.courseNumber.value = data.course.number || '';
                elements.courseTitle.value = data.course.title || '';
                elements.courseCredits.value = data.course.credits || '';
                elements.courseDescription.value = data.course.description || '';

                if (data.course.geneds) {
                    elements.genedBadges.innerHTML = data.course.geneds.map(code =>
                        `<span class="gened-badge">${code}</span>`
                    ).join('');
                }

                if (data.genedOutcomes) {
                    populateGenedOutcomes(data.genedOutcomes);
                }

                // Update search input
                const searchInput = document.getElementById('course-search');
                if (searchInput) {
                    searchInput.value = `${data.course.prefix} ${data.course.number}: ${data.course.title}`;
                }
            }

            // Restore form fields
            if (data.courseObjectives && Array.isArray(data.courseObjectives) && data.courseObjectives.length > 0) {
                data.courseObjectives.forEach(objective => {
                    addObjectiveRow();
                    const items = elements.objectivesList.querySelectorAll('.objective-item');
                    const lastItem = items[items.length - 1];
                    lastItem.querySelector('.objective-input').value = objective;
                });
                SyllabusBuilder.updateField('courseObjectives', data.courseObjectives);
            }

            if (data.gradeScale) {
                const radio = document.querySelector(`input[name="grade-scale"][value="${data.gradeScale}"]`);
                if (radio) {
                    radio.checked = true;
                    if (data.gradeScale === 'plusminus') {
                        elements.customScale.classList.remove('hidden');
                    }
                }
                SyllabusBuilder.updateField('gradeScale', data.gradeScale);
            }

            if (data.customScaleText) {
                elements.customScaleInput.value = data.customScaleText;
                SyllabusBuilder.updateField('customScaleText', data.customScaleText);
            }

            if (data.assignments && data.assignments.length > 0) {
                // Clear default row
                elements.assignmentTbody.innerHTML = '';
                // Add saved assignments
                data.assignments.forEach(assignment => {
                    addAssignmentRow();
                    const rows = elements.assignmentTbody.querySelectorAll('tr');
                    const lastRow = rows[rows.length - 1];
                    lastRow.querySelector('.assignment-name').value = assignment.name || '';
                    lastRow.querySelector('.percentage-input').value = assignment.percentage || '';
                });
                updateAssignments();
            }

            if (data.attendancePolicy) {
                elements.attendancePolicy.value = data.attendancePolicy;
                SyllabusBuilder.updateField('attendancePolicy', data.attendancePolicy);
            }

            if (data.materials && data.materials.length > 0) {
                data.materials.forEach(material => {
                    addMaterialRow();
                    const items = elements.materialsList.querySelectorAll('.material-item');
                    const lastItem = items[items.length - 1];
                    lastItem.querySelector('.material-title').value = material.title || '';
                    lastItem.querySelector('.material-author').value = material.author || '';
                    lastItem.querySelector('.material-publisher').value = material.publisher || '';
                    lastItem.querySelector('.material-edition').value = material.edition || '';
                    lastItem.querySelector('.material-isbn').value = material.isbn || '';
                });
                SyllabusBuilder.updateField('materials', data.materials);
            }

            if (data.additionalMaterials) {
                elements.additionalMaterials.value = data.additionalMaterials;
                SyllabusBuilder.updateField('additionalMaterials', data.additionalMaterials);
            }

            elements.includeDiversity.checked = data.includeDiversity !== false;
            elements.includeCompliance.checked = data.includeCompliance === true;
            elements.diversityPreview.classList.toggle('hidden', !elements.includeDiversity.checked);
            elements.compliancePreview.classList.toggle('hidden', !elements.includeCompliance.checked);
            SyllabusBuilder.updateField('includeDiversity', elements.includeDiversity.checked);
            SyllabusBuilder.updateField('includeCompliance', elements.includeCompliance.checked);

            if (data.customStatements) {
                elements.customStatements.value = data.customStatements;
                SyllabusBuilder.updateField('customStatements', data.customStatements);
            }

        } catch (error) {
            console.error('Failed to load draft:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

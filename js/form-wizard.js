/**
 * Form Wizard Module
 * Handles multi-step form navigation and validation
 */

const FormWizard = (function() {
    let currentStep = 1;
    const totalSteps = 6;
    let onStepChange = null;

    // DOM elements
    let formSteps = [];
    let stepIndicators = [];
    let progressFill = null;
    let prevBtn = null;
    let nextBtn = null;

    /**
     * Initialize the form wizard
     * @param {Function} stepChangeCallback - Callback when step changes
     */
    function init(stepChangeCallback) {
        onStepChange = stepChangeCallback;

        // Get DOM elements
        formSteps = document.querySelectorAll('.form-step');
        stepIndicators = document.querySelectorAll('.step-indicator');
        progressFill = document.getElementById('progress-fill');
        prevBtn = document.getElementById('prev-btn');
        nextBtn = document.getElementById('next-btn');

        // Set up event listeners
        prevBtn.addEventListener('click', goToPrevious);
        nextBtn.addEventListener('click', goToNext);

        // Allow clicking on step indicators for completed steps
        stepIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                const step = index + 1;
                if (step < currentStep) {
                    goToStep(step);
                }
            });
        });

        updateUI();
    }

    /**
     * Go to the previous step
     */
    function goToPrevious() {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    }

    /**
     * Go to the next step
     */
    function goToNext() {
        if (currentStep < totalSteps) {
            goToStep(currentStep + 1);
        }
    }

    /**
     * Go to a specific step
     * @param {number} step - Step number
     */
    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;

        const previousStep = currentStep;
        currentStep = step;
        updateUI();

        if (onStepChange) {
            onStepChange(currentStep, previousStep);
        }
    }

    /**
     * Update UI to reflect current step
     */
    function updateUI() {
        // Update progress bar
        const progress = (currentStep / totalSteps) * 100;
        progressFill.style.width = `${progress}%`;

        // Update form steps
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep - 1);
        });

        // Update step indicators
        stepIndicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');

            if (stepNum === currentStep) {
                indicator.classList.add('active');
            } else if (stepNum < currentStep) {
                indicator.classList.add('completed');
            }
        });

        // Update navigation buttons
        prevBtn.disabled = currentStep === 1;

        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
            nextBtn.textContent = 'Next';
        }
    }

    /**
     * Get current step number
     * @returns {number} Current step
     */
    function getCurrentStep() {
        return currentStep;
    }

    /**
     * Get total number of steps
     * @returns {number} Total steps
     */
    function getTotalSteps() {
        return totalSteps;
    }

    return {
        init,
        goToStep,
        goToNext,
        goToPrevious,
        getCurrentStep,
        getTotalSteps
    };
})();

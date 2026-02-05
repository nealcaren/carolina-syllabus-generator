/**
 * Course Lookup Module
 * Handles course search, autocomplete, and data retrieval
 */

const CourseLookup = (function() {
    let coursesData = {};
    let genedsData = {};
    let searchInput = null;
    let searchResults = null;
    let onCourseSelect = null;

    /**
     * Initialize the course lookup module
     * @param {Function} selectCallback - Callback when a course is selected
     */
    async function init(selectCallback) {
        onCourseSelect = selectCallback;

        // Load data files
        await Promise.all([
            loadCourses(),
            loadGeneds()
        ]);

        // Set up search UI
        searchInput = document.getElementById('course-search');
        searchResults = document.getElementById('search-results');

        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            searchInput.addEventListener('focus', handleSearch);
            searchInput.addEventListener('blur', () => {
                // Delay hiding to allow click on results
                setTimeout(() => {
                    searchResults.classList.remove('active');
                }, 200);
            });
        }
    }

    /**
     * Load courses data from JSON file
     */
    async function loadCourses() {
        try {
            const response = await fetch('js/data/courses.json');
            coursesData = await response.json();
        } catch (error) {
            console.error('Error loading courses:', error);
            coursesData = {};
        }
    }

    /**
     * Load gen ed data from JSON file
     */
    async function loadGeneds() {
        try {
            const response = await fetch('js/data/geneds.json');
            genedsData = await response.json();
        } catch (error) {
            console.error('Error loading gen eds:', error);
            genedsData = {};
        }
    }

    /**
     * Handle search input
     */
    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();

        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }

        const results = searchCourses(query);
        displayResults(results);
    }

    /**
     * Search courses by code or title
     * @param {string} query - Search query
     * @returns {Array} Matching courses
     */
    function searchCourses(query) {
        const results = [];
        const normalizedQuery = query.replace(/\s+/g, '').toLowerCase();

        for (const [key, course] of Object.entries(coursesData)) {
            const code = `${course.prefix}${course.number}`.toLowerCase();
            const codeWithSpace = `${course.prefix} ${course.number}`.toLowerCase();
            const title = course.title.toLowerCase();

            if (code.includes(normalizedQuery) ||
                codeWithSpace.includes(query.toLowerCase()) ||
                title.includes(query.toLowerCase())) {
                results.push({ key, ...course });
            }

            if (results.length >= 10) break;
        }

        return results;
    }

    /**
     * Display search results
     * @param {Array} results - Search results
     */
    function displayResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No courses found</div>';
            searchResults.classList.add('active');
            return;
        }

        searchResults.innerHTML = results.map(course => `
            <div class="search-result-item" data-course-key="${course.key}">
                <span class="course-code">${course.prefix} ${course.number}</span>
                <span class="course-title">${course.title}</span>
            </div>
        `).join('');

        // Add click handlers
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const courseKey = item.dataset.courseKey;
                selectCourse(courseKey);
            });
        });

        searchResults.classList.add('active');
    }

    /**
     * Select a course and populate form
     * @param {string} courseKey - Course identifier
     */
    function selectCourse(courseKey) {
        const course = coursesData[courseKey];
        if (!course) return;

        searchInput.value = `${course.prefix} ${course.number}: ${course.title}`;
        searchResults.classList.remove('active');

        // Get gen ed details
        const genedDetails = course.geneds.map(code => ({
            code,
            ...genedsData[code]
        })).filter(g => g.name);

        // Call callback with course and gen ed data
        if (onCourseSelect) {
            onCourseSelect({
                ...course,
                key: courseKey,
                genedDetails
            });
        }
    }

    /**
     * Get course by key
     * @param {string} key - Course key
     * @returns {Object} Course data
     */
    function getCourse(key) {
        return coursesData[key];
    }

    /**
     * Get gen ed by code
     * @param {string} code - Gen ed code
     * @returns {Object} Gen ed data
     */
    function getGened(code) {
        return genedsData[code];
    }

    /**
     * Get all departments from courses
     * @returns {Array} Unique department prefixes
     */
    function getDepartments() {
        const depts = new Set();
        for (const course of Object.values(coursesData)) {
            depts.add(course.prefix);
        }
        return Array.from(depts).sort();
    }

    return {
        init,
        getCourse,
        getGened,
        getDepartments,
        searchCourses
    };
})();

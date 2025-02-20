function toggleEmployees() {
    const employeesSection = document.getElementById('employees');
    employeesSection.classList.toggle('active');
}

// Close when clicking ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const employeesSection = document.getElementById('employees');
        employeesSection.classList.remove('active');
    }
});
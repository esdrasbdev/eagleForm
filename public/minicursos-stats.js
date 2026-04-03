// Animate stats counters
function animateStats() {
    const numbers = document.querySelectorAll('.stat-number[data-target]');
    numbers.forEach(number => {
        const target = parseInt(number.getAttribute('data-target'));
        const increment = target / 100;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                number.textContent = target;
                clearInterval(timer);
            } else {
                number.textContent = Math.floor(current);
            }
        }, 20);
    });
}

// Run on load
document.addEventListener('DOMContentLoaded', animateStats);


// Sidebar open/close
const sidebar = document.querySelector('.sidebar');
function openSidebar() {
  sidebar.style.right = '0';
}
function closeSidebar() { 
  sidebar.style.right = '-100%'; 
}

// Theme toggle logic
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Load saved theme
const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'dark') {
  body.classList.add('dark');
  themeToggle.textContent = '☀️';
}
else {
  themeToggle.textContent = '🌙';
}

// Toggle on click
themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  const isDark = body.classList.contains('dark');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

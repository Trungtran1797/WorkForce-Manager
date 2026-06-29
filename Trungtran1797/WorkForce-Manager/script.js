// script.js - Interactive features for the modern Vietnamese web UI

// Smooth scroll for navigation links
document.querySelectorAll('a.nav-link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetElem = document.getElementById(targetId);
    if (targetElem) {
      targetElem.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Simple scroll‑reveal animation using IntersectionObserver
const revealElements = document.querySelectorAll('.section');
const observerOptions = {
  threshold: 0.1,
};
const revealOnScroll = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

revealElements.forEach(el => {
  el.classList.add('hidden'); // initial state
  revealOnScroll.observe(el);
});

// Form validation with Vietnamese feedback
const form = document.getElementById('contactForm');
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  if (!name || !email || !message) {
    alert('Vui lòng điền đầy đủ các trường!');
    return;
  }
  // Simple email regex validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert('Địa chỉ email không hợp lệ.');
    return;
  }
  // Here you would normally send the data to a server.
  alert('Cám ơn! Tin nhắn của bạn đã được gửi.');
  form.reset();
});

// Optional: add CSS classes for hidden/visible animations (can be overridden in CSS)
const style = document.createElement('style');
style.innerHTML = `
  .hidden { opacity: 0; transform: translateY(20px); transition: opacity var(--transition-speed) ease-out, transform var(--transition-speed) ease-out; }
  .visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(style);

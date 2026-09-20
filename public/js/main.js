document.addEventListener('DOMContentLoaded', function () {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(function (alert) {
    setTimeout(function () {
      if (window.bootstrap) {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
        if (bsAlert) bsAlert.close();
      }
    }, 5000);
  });

  const path = window.location.pathname.replace(/\/$/, '');
  document.querySelectorAll('.sidebar-link').forEach(function(link) {
    const href = (link.getAttribute('href') || '').replace(/\/$/, '');
    if (href && path === href) link.classList.add('active');
  });
});
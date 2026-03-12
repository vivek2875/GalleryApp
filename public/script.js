function sendOTP() {
  const email = document.getElementById('email').value;
  if (!email) return alert('Please enter email first');

  fetch('http://localhost:3000/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => alert(data.message))
    .catch(err => alert('Failed to send OTP'));
}

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const otp = document.getElementById('otp').value;

  fetch('http://localhost:3000/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('userEmail', email);
        alert("OTP Verified, GO");
        window.location.href = 'upload.html';
      } else {
        alert("Invalid OTP");
      }
    })
    .catch(err => alert('Login failed'));
}

function handleSignUp(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const otp = document.getElementById('otp').value;

  fetch('http://localhost:3000/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('userEmail', email);
        alert("OTP Verified, Move to next page.");
        window.location.href = 'upload.html';
      } else {
        alert("Invalid OTP");
      }
    })
    .catch(err => alert('Sign-up failed'));
}

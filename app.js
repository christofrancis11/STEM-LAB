// SAEDGE STEM Lab Web Application Code
document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT ---
  const state = {
    currentUser: null,
    selectedProgram: 'robotics',
    selectedSessions: 8,
    selectedPaymentMethod: 'UPI',
    bookings: []
  };

  // Program Configurations
  const programsData = {
    robotics: {
      name: 'Robotics',
      desc: 'Learn robotics concepts and build intelligent robots.',
      baseFee: 2500 // for 8 sessions
    },
    ai: {
      name: 'AI & Machine Learning',
      desc: 'Explore the world of Artificial Intelligence.',
      baseFee: 3000
    },
    quantum: {
      name: 'Quantum Computing',
      desc: 'Introduction to quantum computing and its applications.',
      baseFee: 3500
    },
    electronics: {
      name: 'Electronics',
      desc: 'Learn electronics basics and hands-on projects.',
      baseFee: 2200
    }
  };

  // Seed Demo User if database is empty
  const initializeDatabase = () => {
    if (!localStorage.getItem('saedge_users')) {
      const demoUsers = [
        {
          fullName: 'Demo Student',
          mobileNumber: '9876543210',
          age: '15',
          studentClass: 'Class 10',
          address: '123 Innovation Boulevard, Cyber City',
          email: 'demo@saedge.com',
          gender: 'Male',
          loginId: 'demo',
          password: 'password123'
        }
      ];
      localStorage.setItem('saedge_users', JSON.stringify(demoUsers));
    }
    
    if (!localStorage.getItem('saedge_bookings')) {
      const demoBookings = [
        {
          bookingId: 'TXN-98745',
          user: 'demo',
          programKey: 'robotics',
          programName: 'Robotics',
          sessions: 8,
          amount: 2500,
          paymentMethod: 'Card',
          date: '2026-06-28',
          status: 'Active'
        }
      ];
      localStorage.setItem('saedge_bookings', JSON.stringify(demoBookings));
    }
  };

  initializeDatabase();

  // Helper: Retrieve registered users
  const getUsers = () => JSON.parse(localStorage.getItem('saedge_users')) || [];
  
  // Helper: Save a new user
  const saveUser = (user) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('saedge_users', JSON.stringify(users));
  };

  // Helper: Retrieve all bookings
  const getBookings = () => JSON.parse(localStorage.getItem('saedge_bookings')) || [];

  // Helper: Save a new booking
  const saveBooking = (booking) => {
    const bookings = getBookings();
    bookings.push(booking);
    localStorage.setItem('saedge_bookings', JSON.stringify(bookings));
  };

  // --- ELEMENT SELECTORS ---
  const phoneFrame = document.getElementById('phone-frame');
  const screens = document.querySelectorAll('.screen');
  const navItems = document.querySelectorAll('.nav-item');
  const phoneNavbar = document.getElementById('phone-navbar');
  const toast = document.getElementById('toast');
  const modalOverlay = document.getElementById('modal-overlay');

  // --- TOAST NOTIFICATIONS ---
  let toastTimeout;
  const showToast = (message, type = 'info') => {
    clearTimeout(toastTimeout);
    
    // Set text and class
    const textEl = toast.querySelector('.toast-text');
    textEl.textContent = message;
    
    toast.className = 'toast'; // reset
    toast.classList.add(type);
    
    // Setup Icon
    const iconEl = toast.querySelector('.toast-icon');
    let svgIcon = '';
    if (type === 'success') {
      svgIcon = `<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else if (type === 'error') {
      svgIcon = `<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else {
      svgIcon = `<svg viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    iconEl.innerHTML = svgIcon;
    
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  };

  // --- ROUTER / PAGE TRANSITIONS ---
  const navigateTo = (targetScreenId) => {
    const currentScreen = document.querySelector('.screen.active');
    const targetScreen = document.getElementById(`screen-${targetScreenId}`);
    
    if (!targetScreen) return;
    if (currentScreen === targetScreen) return;

    // Reset scroll positions
    const content = targetScreen.querySelector('.screen-content');
    if (content) content.scrollTop = 0;

    // Update bottom nav bar visibility based on screen
    const screensWithNavbar = ['programs', 'sessions', 'profile'];
    if (screensWithNavbar.includes(targetScreenId)) {
      phoneNavbar.style.display = 'flex';
      // Sync bottom active nav icon
      navItems.forEach(item => {
        if (item.dataset.screen === targetScreenId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    } else {
      phoneNavbar.style.display = 'none';
    }

    // Header styling matching (dark/light)
    if (targetScreen.classList.contains('light-theme')) {
      phoneFrame.className = 'phone-frame light-header';
    } else {
      phoneFrame.className = 'phone-frame dark-header';
    }

    // Animate screen transition
    if (currentScreen) {
      currentScreen.classList.add('prev');
      currentScreen.classList.remove('active');
      
      // Delay cleaning up .prev so transition completes
      setTimeout(() => {
        currentScreen.classList.remove('prev');
      }, 400);
    }
    
    targetScreen.classList.add('active');
  };

  // Setup navigation handlers
  document.querySelectorAll('[data-nav]').forEach(element => {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const target = element.getAttribute('data-nav');
      navigateTo(target);
    });
  });

  // Bottom Navigation Bar Click Handlers
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.screen;
      // Block if user not logged in
      if (!state.currentUser && target !== 'home') {
        showToast('Please login to access this section', 'info');
        navigateTo('login');
        return;
      }
      navigateTo(target);
    });
  });

  // --- PASSWORD TOGGLE HANDLERS ---
  document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const inputId = button.dataset.target;
      const passwordInput = document.getElementById(inputId);
      const eyeIcon = button.querySelector('.eye-icon');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `<path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    });
  });

  // --- REGISTRATION LOGIC ---
  const regForm = document.getElementById('registration-form');
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Retrieve fields
    const fullName = document.getElementById('reg-name').value.trim();
    const mobileNumber = document.getElementById('reg-mobile').value.trim();
    const age = document.getElementById('reg-age').value.trim();
    const studentClass = document.getElementById('reg-class').value;
    const address = document.getElementById('reg-address').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const gender = document.getElementById('reg-gender').value;
    const loginId = document.getElementById('reg-login-id').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    // Standard Validation
    if (!fullName || !mobileNumber || !age || !studentClass || !address || !email || !gender || !loginId || !password) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (mobileNumber.length < 10 || isNaN(mobileNumber)) {
      showToast('Please enter a valid mobile number', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    // Check username availability
    const users = getUsers();
    if (users.some(u => u.loginId.toLowerCase() === loginId.toLowerCase())) {
      showToast('Login ID is already taken', 'error');
      return;
    }

    // Create user object
    const newUser = {
      fullName,
      mobileNumber,
      age,
      studentClass,
      address,
      email,
      gender,
      loginId,
      password
    };

    saveUser(newUser);
    showToast('Registration Successful! Please login.', 'success');
    
    // Reset Form
    regForm.reset();
    
    // Redirect to Login Page
    navigateTo('login');
  });

  // --- LOGIN LOGIC ---
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const loginId = document.getElementById('login-id').value.trim();
    const password = document.getElementById('login-password').value;

    if (!loginId || !password) {
      showToast('Please fill all login fields', 'error');
      return;
    }

    const users = getUsers();
    const foundUser = users.find(u => u.loginId.toLowerCase() === loginId.toLowerCase() && u.password === password);

    if (foundUser) {
      state.currentUser = foundUser;
      showToast(`Welcome Back, ${foundUser.fullName}!`, 'success');
      
      // Update UI components
      updateProfileScreen();
      updateSessionsScreen();
      
      // Reset form
      loginForm.reset();
      
      // Direct user to program page
      navigateTo('programs');
    } else {
      showToast('Invalid Login ID or Password', 'error');
    }
  });

  // --- FEE CALCULATOR & PROGRAM SELECTION ---
  const programCards = document.querySelectorAll('.program-card');
  const sessionsSelect = document.getElementById('sessions-count');
  
  const programFeeEl = document.getElementById('calc-program-fee');
  const totalAmountEl = document.getElementById('calc-total-amount');

  const calculateFees = () => {
    const progKey = state.selectedProgram;
    const sessions = parseInt(state.selectedSessions);
    
    const baseProgram = programsData[progKey];
    if (!baseProgram) return;

    // Fee calculation logic: base fee scales linearly with session count (relative to base of 8)
    const multiplier = sessions / 8;
    const finalFee = Math.round(baseProgram.baseFee * multiplier);
    
    // Update labels
    programFeeEl.textContent = `₹ ${finalFee.toLocaleString('en-IN')}`;
    totalAmountEl.textContent = `₹ ${finalFee.toLocaleString('en-IN')}`;
  };

  // Program Card clicks
  programCards.forEach(card => {
    card.addEventListener('click', () => {
      programCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      state.selectedProgram = card.dataset.program;
      calculateFees();
    });
  });

  // Sessions Dropdown change
  sessionsSelect.addEventListener('change', (e) => {
    state.selectedSessions = parseInt(e.target.value);
    calculateFees();
  });

  // Payment Method Toggles
  const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
  paymentMethodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      paymentMethodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedPaymentMethod = btn.dataset.method;
    });
  });

  // --- CHECKOUT / PAYMENT FLOW ---
  const payNowBtn = document.getElementById('pay-now-btn');
  
  const openModal = (htmlContent) => {
    const modalContentContainer = modalOverlay.querySelector('.modal-content');
    modalContentContainer.innerHTML = htmlContent;
    modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
  };

  payNowBtn.addEventListener('click', () => {
    // Check if logged in
    if (!state.currentUser) {
      showToast('Please login to purchase a program', 'info');
      navigateTo('login');
      return;
    }

    const progKey = state.selectedProgram;
    const sessions = state.selectedSessions;
    const paymentMethod = state.selectedPaymentMethod;
    const programInfo = programsData[progKey];
    
    const finalAmount = Math.round(programInfo.baseFee * (sessions / 8));
    const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const today = new Date().toISOString().split('T')[0];

    // Show Loading Modal
    const loadingHtml = `
      <div class="spinner"></div>
      <div class="modal-title">Processing Payment</div>
      <div class="modal-desc">Securely transferring funds via ${paymentMethod}. Please do not close the app.</div>
    `;
    openModal(loadingHtml);

    // Simulate payment response after 2 seconds
    setTimeout(() => {
      // Save booking in local storage
      const newBooking = {
        bookingId: txnId,
        user: state.currentUser.loginId,
        programKey: progKey,
        programName: programInfo.name,
        sessions: sessions,
        amount: finalAmount,
        paymentMethod: paymentMethod,
        date: today,
        status: 'Active'
      };
      
      saveBooking(newBooking);
      
      // Update My Sessions screen
      updateSessionsScreen();

      // Show Success Modal with Receipt
      const successHtml = `
        <div class="success-checkmark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="modal-title" style="color: var(--accent-green)">Payment Successful!</div>
        <div class="modal-desc">You are now enrolled in the ${programInfo.name} program.</div>
        
        <div class="receipt-box">
          <div class="receipt-header">SAEDGE AI AUTOMATIONS</div>
          <div class="receipt-row"><span>Receipt ID:</span><strong>${txnId}</strong></div>
          <div class="receipt-row"><span>Student Name:</span><strong>${state.currentUser.fullName}</strong></div>
          <div class="receipt-row"><span>Program:</span><strong>${programInfo.name}</strong></div>
          <div class="receipt-row"><span>Duration:</span><strong>${sessions} Sessions</strong></div>
          <div class="receipt-row"><span>Method:</span><strong>${paymentMethod}</strong></div>
          <div class="receipt-row"><span>Date:</span><strong>${today}</strong></div>
          <div class="receipt-row total"><span>Total Amount:</span><strong>₹ ${finalAmount.toLocaleString('en-IN')}</strong></div>
        </div>

        <button id="modal-close-btn" class="btn btn-primary">Go to My Sessions</button>
      `;
      
      openModal(successHtml);
      
      // Attach listener to new close button
      document.getElementById('modal-close-btn').addEventListener('click', () => {
        closeModal();
        navigateTo('sessions');
      });
      
    }, 2000);
  });

  // --- SESSIONS DASHBOARD RENDERING ---
  const sessionsContentContainer = document.getElementById('sessions-content-container');
  
  const updateSessionsScreen = () => {
    if (!state.currentUser) return;
    
    const bookings = getBookings().filter(b => b.user === state.currentUser.loginId);
    
    if (bookings.length === 0) {
      sessionsContentContainer.innerHTML = `
        <div class="dashboard-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p style="font-weight: 600; font-size: 15px; margin-bottom: 8px; color: var(--text-light-primary)">No Booked Sessions</p>
          <p style="font-size: 13px; max-width: 250px; margin-bottom: 24px;">Explore our Robotics and AI programs to book your first training sessions.</p>
          <button class="btn btn-primary" id="go-to-programs-empty" style="max-width: 180px;">Browse Programs</button>
        </div>
      `;
      
      document.getElementById('go-to-programs-empty').addEventListener('click', () => {
        navigateTo('programs');
      });
      return;
    }

    // Sort by date descending
    bookings.sort((a,b) => new Date(b.date) - new Date(a.date));

    let html = '<div class="programs-section-title">My Registered Programs</div>';
    
    bookings.forEach(b => {
      let iconSvg = '';
      if (b.programKey === 'robotics') {
        iconSvg = `<path d="M12 2a2 2 0 012 2v1h1a3 3 0 013 3v2a3 3 0 01-3 3h-1v1a4 4 0 01-4 4h-2a4 4 0 01-4-4v-1H6a3 3 0 01-3-3V8a3 3 0 013-3h1V4a2 2 0 012-2h3zm-4 7v2h8V9H8zm2 6v2h4v-2h-4z" stroke-width="2" stroke-linecap="round"/>`;
      } else if (b.programKey === 'ai') {
        iconSvg = `<path d="M12 3v18M3 12h18M12 3a9 9 0 010 18M12 3a9 9 0 000 18M3 12a9 9 0 0018 0M3 12a9 9 0 0118 0" stroke-width="2"/>`;
      } else if (b.programKey === 'quantum') {
        iconSvg = `<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6a6 6 0 100 12 6 6 0 000-12z" stroke-width="2"/>`;
      } else {
        iconSvg = `<rect x="4" y="4" width="16" height="16" rx="2" stroke-width="2"/><path d="M9 9h6v6H9z" stroke-width="2"/>`;
      }

      html += `
        <div class="booked-program-card">
          <div class="booked-header">
            <div class="booked-title-box">
              <span style="color: var(--primary)">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-linecap="round">${iconSvg}</svg>
              </span>
              <h4>${b.programName}</h4>
            </div>
            <span class="status-badge active">${b.status}</span>
          </div>
          <div class="booked-details">
            <div class="booked-detail-row">
              <span>Receipt Ref:</span>
              <strong>${b.bookingId}</strong>
            </div>
            <div class="booked-detail-row">
              <span>Allocated Hours:</span>
              <strong>${b.sessions} Classes (${b.sessions * 1.5} Hours)</strong>
            </div>
            <div class="booked-detail-row">
              <span>Date Enrolled:</span>
              <strong>${b.date}</strong>
            </div>
            <div class="booked-detail-row">
              <span>Paid via:</span>
              <strong>${b.paymentMethod} (₹ ${b.amount.toLocaleString('en-IN')})</strong>
            </div>
          </div>
        </div>
      `;
    });

    sessionsContentContainer.innerHTML = html;
  };

  // --- PROFILE SCREEN RENDERING & LOGOUT ---
  const profileNameEl = document.getElementById('profile-student-name');
  const profileDetailsContainer = document.getElementById('profile-details-container');
  const logoutBtn = document.getElementById('profile-logout-btn');

  const updateProfileScreen = () => {
    if (!state.currentUser) return;
    
    const u = state.currentUser;
    profileNameEl.textContent = u.fullName;
    
    profileDetailsContainer.innerHTML = `
      <div class="profile-info-item">
        <svg viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="profile-info-label">Mobile</span>
        <span class="profile-info-val">${u.mobileNumber}</span>
      </div>
      <div class="profile-info-item">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="profile-info-label">Age</span>
        <span class="profile-info-val">${u.age} Years</span>
      </div>
      <div class="profile-info-item">
        <svg viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="profile-info-label">Grade / Class</span>
        <span class="profile-info-val">${u.studentClass}</span>
      </div>
      <div class="profile-info-item">
        <svg viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="11" r="3" stroke-width="2"/></svg>
        <span class="profile-info-label">Address</span>
        <span class="profile-info-val" style="font-size:12px; line-height:1.4;">${u.address}</span>
      </div>
      <div class="profile-info-item">
        <svg viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="profile-info-label">Email</span>
        <span class="profile-info-val" style="word-break: break-all;">${u.email}</span>
      </div>
      <div class="profile-info-item">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke-width="2" stroke-linecap="round"/></svg>
        <span class="profile-info-label">Gender</span>
        <span class="profile-info-val">${u.gender}</span>
      </div>
      <div class="profile-info-item">
        <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-width="2" stroke-linecap="round"/><circle cx="8.5" cy="7" r="4" stroke-width="2"/></svg>
        <span class="profile-info-label">Login ID</span>
        <span class="profile-info-val"><strong>${u.loginId}</strong></span>
      </div>
    `;
  };

  logoutBtn.addEventListener('click', () => {
    state.currentUser = null;
    showToast('Logged out successfully', 'success');
    navigateTo('landing');
  });

  // Initialize view values
  calculateFees();
});

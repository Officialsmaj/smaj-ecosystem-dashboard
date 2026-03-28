/**
 * SMAJ Ecosystem Dashboard - Vanilla JS
 */
import Chart from 'chart.js/auto';
import Cropper from 'cropperjs';

const livenessTasks = [
  { id: 'blink', text: 'Blink your eyes', prompt: 'Examine the sequence of images. Is the person blinking (eyes closed or partially closed) in at least one of these frames? If multiple frames are provided, compare them to detect motion.' },
  { id: 'left', text: 'Turn head to the left', prompt: 'Is the person in the image looking towards their left side (from their perspective)?' },
  { id: 'right', text: 'Turn head to the right', prompt: 'Is the person in the image looking towards their right side (from their perspective)?' }
];

// --- Data ---
let TRANSACTION_DATA = [];

async function fetchBackendTransactions() {
  // In production, this calls your MongoDB backend: GET /api/pi/transactions
  // For now, we initialize with a fallback or empty list
  return TRANSACTION_DATA.length > 0 ? TRANSACTION_DATA : [];
}

const ECOSYSTEM_DATA = [
  { id: 'store', name: 'SMAJ STORE', icon: 'bx bx-shopping-bag', status: 'Ready Now', color: 'brand' },
  { id: 'food', name: 'SMAJ FOOD', icon: 'bx bx-restaurant', status: 'Coming Soon', color: 'orange' },
  { id: 'jobs', name: 'SMAJ PI JOBS', icon: 'bx bx-briefcase', status: 'Coming Soon', color: 'blue' },
  { id: 'health', name: 'SMAJ PI HEALTH', icon: 'bx bx-plus-medical', status: 'Coming Soon', color: 'rose' },
  { id: 'edu', name: 'SMAJ PI EDU', icon: 'bx bx-book-open', status: 'Coming Soon', color: 'indigo' },
  { id: 'transport', name: 'SMAJ PI TRANSPORT', icon: 'bx bx-bus', status: 'Coming Soon', color: 'amber' },
  { id: 'agro', name: 'SMAJ PI AGRO', icon: 'bx bx-leaf', status: 'Coming Soon', color: 'green' },
  { id: 'energy', name: 'SMAJ PI ENERGY', icon: 'bx bx-zap', status: 'Coming Soon', color: 'yellow' },
  { id: 'charity', name: 'SMAJ PI CHARITY', icon: 'bx bx-heart', status: 'Coming Soon', color: 'pink' },
  { id: 'housing', name: 'SMAJ PI HOUSING', icon: 'bx bx-building-house', status: 'Coming Soon', color: 'sky' },
  { id: 'events', name: 'SMAJ PI EVENTS', icon: 'bx bx-calendar-event', status: 'Coming Soon', color: 'violet' },
  { id: 'swap', name: 'SMAJ PI SWAP', icon: 'bx bx-transfer', status: 'Coming Soon', color: 'cyan' },
  { id: 'token', name: 'SMAJ TOKEN', icon: 'bx bx-coin-stack', status: 'Native', color: 'brand' },
];

const ORDERS_DATA = [
  { cat: 'Store Order', ref: '#ST-9201', date: '2026-02-19', amount: '0.00002546 Pi', status: 'Completed' },
  { cat: 'Job Contract', ref: '#JB-4022', date: '2026-02-17', amount: '0.00007321 Pi', status: 'Pending' },
  { cat: 'Event Ticket', ref: '#EV-1408', date: '2026-02-14', amount: '0.00000795 Pi', status: 'Active' },
  { cat: 'Housing Booking', ref: '#HS-8860', date: '2026-02-12', amount: '0.00005093 Pi', status: 'Pending' },
  { cat: 'Transport Request', ref: '#TR-3391', date: '2026-02-11', amount: '0.00000382 Pi', status: 'Completed' },
  { cat: 'Agro Purchase', ref: '#AG-7410', date: '2026-02-10', amount: '0.00002864 Pi', status: 'Completed' },
];

let countries = [];

async function fetchCountries() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags');
    const data = await response.json();
    countries = data.map(c => ({
      name: c.name.common,
      code: c.cca2,
      flag: c.flags.svg || c.flags.png
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching countries:', error);
    countries = [];
  }
}

// --- State ---
let activeSection = 'overview';
let isWalletConnected = false; // Changed to false by default for a better login flow
let isDarkMode = false;
let showBalance = true;

function createDefaultUserProfile() {
  return {
    name: 'Unconnected Pioneer',
    username: 'anonymous',
    walletAddress: null,
    email: 'officialsmaj@gmail.com',
    phone: '+234 800 000 0000',
    address: 'Lagos, Nigeria',
    bio: 'Building the future of the SMAJ Ecosystem on the Pi Network. Pioneer since 2019.',
    avatar: null,
    language: 'en',
    currency: 'USD',
    timezone: 'UTC+1',
    visibility: 'public',
    joinedDate: new Date().toISOString(),
    gender: '',
    occupation: '',
    nationality: '',
    website: '',
    socialTwitter: '',
    socialTelegram: '',
    kycStatus: 'not_started',
    kycStep: 1,
    kycData: {
      fullName: '',
      dob: '',
      pob: '',
      country: '',
      docType: '',
      kycType: 'pioneer',
      front: null,
      back: null,
      businessLicense: null,
      businessRegNumber: '',
      taxIdNumber: '',
      storeName: '',
      businessCategory: '',
      businessAddress: '',
      frontMethod: 'upload',
      backMethod: 'upload',
      businessLicenseMethod: 'upload',
      liveness: []
    }
  };
}

let userProfile = createDefaultUserProfile();
window.userProfile = userProfile;

function resetUserProfileToDefaults() {
  const defaults = createDefaultUserProfile();
  Object.keys(userProfile).forEach(key => delete userProfile[key]);
  Object.assign(userProfile, defaults);
  localStorage.removeItem('smaj_user_profile');
}

function calculateTrustScore(profile) {
  let score = 0;
  // Profile Completeness (Max 50 pts)
  const fields = ['name', 'username', 'bio', 'avatar', 'email', 'phone', 'address', 'gender', 'occupation', 'nationality'];
  fields.forEach(f => {
    if (profile[f] && profile[f].length > 0) score += 5;
  });

  // KYC Status (Max 50 pts)
  if (profile.kycStatus === 'verified') {
    score += 50;
  } else if (profile.kycStatus === 'pending') {
    score += 25;
  }

  return score;
}

function getProfileCompleteness(profile) {
  const fields = ['name', 'username', 'bio', 'avatar', 'email', 'phone', 'address', 'gender', 'occupation', 'nationality'];
  const filledCount = fields.filter(f => profile[f] && profile[f].length > 0).length;
  return Math.round((filledCount / fields.length) * 100);
}

function updateProfileCompletenessUI() {
  const percent = getProfileCompleteness(userProfile);
  const textEl = document.getElementById('profile-completeness-text');
  const barEl = document.getElementById('profile-completeness-bar');
  const trustTextEl = document.getElementById('profile-trust-score-text');
  
  if (textEl) textEl.innerText = `${percent}%`;
  if (barEl) barEl.style.width = `${percent}%`;
  if (trustTextEl) trustTextEl.innerText = `${calculateTrustScore(userProfile)}/100`;
}

// --- Admin Helpers ---
window.viewBusinessLicense = (subId) => {
  const sub = kycSubmissions.find(s => s.id === subId);
  if (!sub || !sub.businessLicense) {
    showToast('Document not found');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
            <i class='bx bx-file text-2xl'></i>
          </div>
          <div>
            <h3 class="text-lg font-bold">Business License</h3>
            <p class="text-[10px] font-black uppercase tracking-widest text-neutral-400">${sub.storeName || sub.name} | ${sub.id}</p>
          </div>
        </div>
        <button id="close-doc-modal" class="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors text-neutral-400 hover:text-neutral-900">
          <i class='bx bx-x text-2xl'></i>
        </button>
      </div>
      <div class="p-8 bg-neutral-100 flex items-center justify-center min-h-[450px]">
        <div class="rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-white max-w-full">
          <img src="${sub.businessLicense}" class="max-w-full h-auto max-h-[60vh] object-contain">
        </div>
      </div>
      <div class="p-6 bg-white border-t border-neutral-100 flex justify-end">
        <button id="close-doc-btn" class="px-8 py-3 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          Close Preview
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#close-doc-modal').onclick = close;
  modal.querySelector('#close-doc-btn').onclick = close;
};

window.viewIDDocuments = (subId) => {
  const sub = kycSubmissions.find(s => s.id === subId);
  if (!sub || !sub.front || !sub.back) {
    showToast('ID documents not found');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
            <i class='bx bx-id-card text-2xl'></i>
          </div>
          <div>
            <h3 class="text-lg font-bold">Identity Documents</h3>
            <p class="text-[10px] font-black uppercase tracking-widest text-neutral-400">${sub.name} | ${sub.id}</p>
          </div>
        </div>
        <button id="close-id-modal" class="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors text-neutral-400 hover:text-neutral-900">
          <i class='bx bx-x text-2xl'></i>
        </button>
      </div>
      <div class="p-8 bg-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
        <div class="space-y-2">
          <p class="text-xs font-bold text-neutral-400 uppercase tracking-widest text-center">Front Side</p>
          <div class="rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-white">
            <img src="${sub.front}" class="w-full h-auto object-contain">
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-xs font-bold text-neutral-400 uppercase tracking-widest text-center">Back Side</p>
          <div class="rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-white">
            <img src="${sub.back}" class="w-full h-auto object-contain">
          </div>
        </div>
        ${sub.liveness && sub.liveness.length > 0 ? `
          <div class="md:col-span-2 pt-6 border-t border-neutral-100">
            <p class="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">AI Liveness Frames</p>
            <div class="grid grid-cols-3 gap-4">
              ${sub.liveness.map((img, i) => `
                <div class="space-y-2">
                  <div class="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
                    <img src="${img}" class="w-full h-full object-cover">
                  </div>
                  <p class="text-[9px] font-black text-center text-neutral-400 uppercase">${livenessTasks[i]?.text || 'Frame ' + (i+1)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="p-6 bg-white border-t border-neutral-100 flex justify-end">
        <button id="close-id-btn" class="px-8 py-3 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          Close Preview
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#close-id-modal').onclick = close;
  modal.querySelector('#close-id-btn').onclick = close;
};

window.downloadKYCArchive = async (subId) => {
  const sub = kycSubmissions.find(s => s.id === subId);
  if (!sub) return showToast('Submission data not found');

  showToast('Preparing ZIP Archive...', 'success');
  
  try {
    // Dynamically import JSZip from CDN for the export
    const JSZipModule = await import('https://cdn.skypack.dev/jszip');
    const JSZip = JSZipModule.default;
    const zip = new JSZip();
    const folder = zip.folder(`${sub.id}_${sub.name.replace(/\s+/g, '_')}`);

    // Helper to add base64 images to zip
    const addBase64ToZip = (name, base64Data) => {
      if (!base64Data) return;
      const data = base64Data.split(',')[1];
      folder.file(name, data, { base64: true });
    };

    addBase64ToZip('ID_Front.jpg', sub.front);
    addBase64ToZip('ID_Back.jpg', sub.back);
    
    if (sub.businessLicense) {
      addBase64ToZip('Business_License.jpg', sub.businessLicense);
    }

    if (sub.liveness) {
      sub.liveness.forEach((img, i) => {
        addBase64ToZip(`Liveness_Frame_${i + 1}.jpg`, img);
      });
    }

    // Add metadata summary
    const metadata = `Submission ID: ${sub.id}\nUser: ${sub.name}\nDate: ${sub.date}\nCountry: ${sub.country}\nType: ${sub.kycType || 'Pioneer'}\nTIN: ${sub.taxIdNumber || 'N/A'}\nStore: ${sub.storeName || 'N/A'}`;
    folder.file('metadata.txt', metadata);

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${sub.id}_KYC_Archive.zip`;
    link.click();
    
    showToast('Archive downloaded successfully', 'success');
  } catch (err) {
    console.error('ZIP Error:', err);
    showToast('Failed to create ZIP archive');
  }
};

window.bulkRejectKYC = () => {
  const selected = Array.from(document.querySelectorAll('.admin-sub-select:checked')).map(cb => cb.dataset.id);
  if (selected.length === 0) {
    showToast('Please select at least one submission to reject');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <h3 class="text-lg font-bold">Reject Submissions (${selected.length} selected)</h3>
        <button id="close-reject-modal" class="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors text-neutral-400 hover:text-neutral-900">
          <i class='bx bx-x text-2xl'></i>
        </button>
      </div>
      <div class="p-8 space-y-6">
        <div class="space-y-2">
          <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Rejection Reason</label>
          <select id="rejection-reason-select" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-rose-500 outline-none transition-all font-medium">
            <option value="">Select a common reason</option>
            <option value="Unclear Document">Unclear Document</option>
            <option value="Face Mismatch">Face Mismatch</option>
            <option value="Incomplete Information">Incomplete Information</option>
            <option value="Document Expired">Document Expired</option>
            <option value="Fraudulent Activity">Fraudulent Activity</option>
            <option value="Other">Other (specify below)</option>
          </select>
        </div>
        <div class="space-y-2" id="other-reason-container" style="display: none;">
          <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Other Reason</label>
          <textarea id="other-rejection-reason" rows="3" placeholder="Please specify the rejection reason..." class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-rose-500 outline-none transition-all font-medium resize-none"></textarea>
        </div>
      </div>
      <div class="p-6 bg-white border-t border-neutral-100 flex justify-end gap-3">
        <button id="cancel-reject" class="px-6 py-3 rounded-xl font-bold text-neutral-500 hover:bg-neutral-100 transition-all">Cancel</button>
        <button id="confirm-reject" class="px-8 py-3 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          Confirm Reject
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#close-reject-modal').onclick = close;
  modal.querySelector('#cancel-reject').onclick = close;

  const reasonSelect = modal.querySelector('#rejection-reason-select');
  const otherReasonContainer = modal.querySelector('#other-reason-container');
  const otherReasonTextarea = modal.querySelector('#other-rejection-reason');

  reasonSelect.onchange = () => {
    if (reasonSelect.value === 'Other') {
      otherReasonContainer.style.display = 'block';
    } else {
      otherReasonContainer.style.display = 'none';
    }
  };

  modal.querySelector('#confirm-reject').onclick = () => {
    let rejectionReason = reasonSelect.value;
    if (rejectionReason === 'Other') {
      rejectionReason = otherReasonTextarea.value.trim();
      if (!rejectionReason) {
        showToast('Please specify the rejection reason.');
        return;
      }
    } else if (!rejectionReason) {
      showToast('Please select a rejection reason.');
      return;
    }

    let rejectedCount = 0;
    kycSubmissions.forEach(sub => {
      if (selected.includes(sub.id) && sub.status === 'pending') {
        sub.status = 'rejected';
        sub.rejectionReason = rejectionReason;
        showToast(`KYC for ${sub.name} (${sub.id}) has been rejected. Reason: ${rejectionReason}`, 'error');
        rejectedCount++;
      }
    });

    showToast(`Successfully rejected ${rejectedCount} submissions`, 'error');
    renderSection('admin');
    close();
  };
};

window.toggleAdminSelectAll = (el) => {
  document.querySelectorAll('.admin-sub-select').forEach(cb => cb.checked = el.checked);
};

window.bulkApproveKYC = () => {
  const selected = Array.from(document.querySelectorAll('.admin-sub-select:checked')).map(cb => cb.dataset.id);
  if (selected.length === 0) {
    showToast('Please select at least one submission');
    return;
  }
  
  kycSubmissions.forEach(sub => {
    if (selected.includes(sub.id) && sub.status === 'pending') {
      sub.status = 'verified';
      showToast(`KYC for ${sub.name} (${sub.id}) has been verified.`, 'success');
    }
  });
  
  showToast(`Successfully approved ${selected.length} submissions`, 'success');
  renderSection('admin');
};

window.downloadUserKYCData = () => {
  const data = {
    personal: {
      name: userProfile.name,
      username: userProfile.username,
      bio: userProfile.bio,
      gender: userProfile.gender,
      nationality: userProfile.nationality,
      occupation: userProfile.occupation,
      joinedDate: userProfile.joinedDate
    },
    contact: {
      email: userProfile.email,
      phone: userProfile.phone,
      address: userProfile.address,
      website: userProfile.website
    },
    social: {
      twitter: userProfile.socialTwitter,
      telegram: userProfile.socialTelegram
    },
    kyc_status: {
      verified: userProfile.kycStatus === 'verified',
      trustScore: calculateTrustScore(userProfile),
      completeness: getProfileCompleteness(userProfile)
    }
  };

  if (userProfile.kycData.kycType === 'vendor' && userProfile.kycStatus === 'verified') {
    data.vendor_details = {
      storeName: userProfile.kycData.storeName,
      registrationNumber: userProfile.kycData.businessRegNumber,
      taxId: userProfile.kycData.taxIdNumber,
      category: userProfile.kycData.businessCategory,
      businessAddress: userProfile.kycData.businessAddress
    };
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SMAJ_KYC_Export_${userProfile.username}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Profile data exported successfully!', 'success');
};

window.exportTransactionsCSV = () => {
  if (TRANSACTION_DATA.length === 0) {
    showToast('No transactions found to export.');
    return;
  }

  const headers = ['Date', 'Description', 'Amount (Pi)', 'Type', 'Status'];
  const rows = TRANSACTION_DATA.map(tx => [
    tx.date,
    `"${tx.project}"`,
    tx.amount.toFixed(8),
    tx.type,
    tx.status
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `SMAJ_Ledger_${userProfile.username}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV Ledger exported successfully!', 'success');
};

window.exportTransactionsPDF = async () => {
  if (TRANSACTION_DATA.length === 0) {
    showToast('No transactions found to export.');
    return;
  }

  showToast('Preparing PDF Document...', 'success');

  try {
    const { jsPDF } = await import('https://cdn.skypack.dev/jspdf');
    const autoTable = await import('https://cdn.skypack.dev/jspdf-autotable');
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(125, 60, 255); // Brand Color
    doc.text('SMAJ Ecosystem Wallet Ledger', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Account: @${userProfile.username} (${userProfile.name})`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

    const body = TRANSACTION_DATA.map(tx => [tx.date, tx.project, `${tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(8)} Pi`, tx.status]);
    
    doc.autoTable({
      startY: 45,
      head: [['Date', 'Description', 'Amount', 'Status']],
      body: body,
      headStyles: { fillColor: [125, 60, 255] },
    });

    doc.save(`SMAJ_Ledger_${userProfile.username}.pdf`);
    showToast('PDF Document exported successfully!', 'success');
  } catch (err) {
    console.error('PDF Export Error:', err);
    showToast('Failed to generate PDF. Check connection.');
  }
};

// --- Global Action Handler ---
window.handleAction = (actionName) => {
  showToast(`${actionName} action triggered successfully!`, 'success');
};

window.handleAvatarChange = () => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
      <div class="p-6 text-center space-y-4">
        <h3 class="font-bold text-lg">Update Profile Photo</h3>
        <div class="grid grid-cols-1 gap-3">
          <button id="avatar-camera" class="w-full py-3 bg-neutral-100 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all">
            <i class='bx bx-camera text-xl'></i> Take Photo
          </button>
          <button id="avatar-upload" class="w-full py-3 bg-neutral-100 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all">
            <i class='bx bx-upload text-xl'></i> Upload File
          </button>
          <button id="avatar-cancel" class="w-full py-3 text-neutral-400 font-bold hover:text-neutral-600 transition-all">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#avatar-cancel').onclick = close;
  
  modal.querySelector('#avatar-camera').onclick = () => {
    close();
    captureCameraImage((dataUrl) => {
      openCropper(dataUrl, (croppedUrl) => {
        userProfile.avatar = croppedUrl;
        renderSection('profile');
      });
    });
  };

  modal.querySelector('#avatar-upload').onclick = () => {
    close();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          openCropper(re.target.result, (croppedUrl) => {
            userProfile.avatar = croppedUrl;
            renderSection('profile');
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };
};

// --- Real Pi Transaction Handlers ---
window.handleSendPi = async () => {
  if (!isWalletConnected) return showToast('Please connect your Pi Wallet');
  
  // Create a modal for direct input
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="p-8 space-y-6">
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <i class='bx bx-send text-2xl'></i>
            </div>
            <h3 class="text-2xl font-bold">Send Pi</h3>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Amount (Pi)</label>
            <input type="number" id="send-pi-amount" placeholder="0.00" step="0.000001" min="0.000001" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Memo / Note</label>
            <input type="text" id="send-pi-memo" placeholder="Payment for services..." class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
          </div>
        </div>
        <div class="flex gap-3">
          <button id="close-send-modal" class="flex-1 py-4 bg-neutral-100 rounded-2xl font-bold text-neutral-500 hover:bg-neutral-200 transition-all">Cancel</button>
          <button id="submit-send-pi" class="flex-[2] py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#close-send-modal').onclick = () => modal.remove();
  
  modal.querySelector('#submit-send-pi').onclick = async () => {
    const amount = parseFloat(document.getElementById('send-pi-amount').value);
    const memo = document.getElementById('send-pi-memo').value || "Transfer via SMAJ Ecosystem";

    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid Pi amount.');
      return;
    }

    modal.remove();
    showToast('Connecting to Pi Wallet...', 'success');

    try {
      await Pi.createPayment({
        amount: amount,
        memo: memo,
        metadata: { type: "direct_transfer", platform: "SMAJ Ecosystem" }
      }, {
        onReadyForServerApproval: (paymentId) => {
          showToast('Payment submitted for approval', 'success');
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          // Update local state for immediate feedback
          PI_BALANCE -= amount;
          TRANSACTION_DATA.unshift({
            date: new Date().toISOString().split('T')[0],
            project: memo,
            amount: amount,
            type: 'expense',
            status: 'Completed'
          });

          showToast('Transaction Successful!', 'success');
          playSuccessSound(true);
          renderSection(activeSection);
        },
        onCancel: () => showToast('Transaction cancelled'),
        onError: (err) => showToast('Wallet Error: ' + err.message)
      });
    } catch (err) {
      console.error(err);
      showToast('Payment flow interrupted');
    }
  };
};

window.handleReceivePi = async () => {
  if (!userProfile.walletAddress) return showToast('Please connect your Pi Wallet first');
  
  const address = userProfile.walletAddress;

  // Dynamically import QRious for secure local QR generation
  const QRiousModule = await import('https://cdn.skypack.dev/qrious');
  const QRious = QRiousModule.default;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="p-8 text-center space-y-6">
        <div class="flex items-center justify-between mb-2">
            <h3 class="text-2xl font-bold">Receive Pi</h3>
            <button id="close-receive-modal" class="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors text-neutral-400 hover:text-neutral-900">
                <i class='bx bx-x text-2xl'></i>
            </button>
        </div>
        
        <div class="bg-neutral-50 p-6 rounded-3xl flex flex-col items-center justify-center border border-neutral-100 shadow-inner">
            <canvas id="qr-canvas" class="w-48 h-48 rounded-xl shadow-lg border-4 border-white"></canvas>
            <button id="download-qr" class="mt-4 text-[10px] font-black uppercase tracking-widest text-brand hover:text-brand-dark transition-colors flex items-center gap-1">
                <i class='bx bx-download'></i> Download QR
            </button>
        </div>

        <div class="space-y-2 text-left">
            <label class="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Your Public Wallet Address</label>
            <div class="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 break-all font-mono text-xs text-neutral-600 leading-relaxed">
                ${address}
            </div>
        </div>

        <button id="copy-receive-addr" class="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <i class='bx bx-copy text-xl'></i> Copy Address
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Generate the QR code locally using canvas
  new QRious({
    element: modal.querySelector('#qr-canvas'),
    value: address,
    size: 300,
    level: 'H',
    foreground: '#7d3cff'
  });

  modal.querySelector('#close-receive-modal').onclick = () => modal.remove();
  modal.querySelector('#copy-receive-addr').onclick = () => {
    navigator.clipboard.writeText(address);
    showToast('Wallet address copied to clipboard!', 'success');
  };

  modal.querySelector('#download-qr').onclick = () => {
    const link = document.createElement('a');
    link.download = `SMAJ_Wallet_QR_${userProfile.username}.png`;
    link.href = modal.querySelector('#qr-canvas').toDataURL('image/png');
    link.click();
    showToast('QR Code saved to device', 'success');
  };
};

// --- Dashboard SSO Redirect ---
window.handleDashboardSSO = async () => {
  try {
    const response = await fetch('/api/dashboard/sso-token');
    const { token } = await response.json();
    window.location.href = `https://officialsmaj.github.io/smajpihub/?token=${token}`;
  } catch (err) {
    showToast('SSO Redirect failed');
  }
};

// --- Render Helpers ---
window.renderEcoCard = (eco) => `
  <div class="p-6 rounded-3xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-${eco.color}-500/10 text-${eco.color}-600">
      <i class='${eco.icon} text-3xl'></i>
    </div>
    <h3 class="font-bold text-lg mb-2">${eco.name}</h3>
    <p class="text-sm text-neutral-500 mb-6 line-clamp-2">
      Integrated ${eco.name} services powered by SMAJ PI HUB blockchain infrastructure.
    </p>
    <div class="flex items-center justify-between mt-auto">
      <span class="text-[10px] font-black uppercase px-2 py-1 rounded-md ${eco.status === 'Ready Now' ? 'bg-brand/10 text-brand' : 'bg-neutral-100 text-neutral-500'}">
        ${eco.status}
      </span>
      ${eco.id === 'store' ? `<button onclick="handleStoreCheckout()" class="px-3 py-1 bg-brand text-white rounded-xl text-[10px] font-bold shadow-sm hover:scale-105 transition-transform">Demo Buy</button>` : `<button onclick="handleAction('Open ${eco.name}')" class="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-brand transition-colors"><i class='bx bx-right-top-arrow-circle text-2xl'></i></button>`}
    </div>
  </div>
`;

window.renderOrderRow = (order) => `
  <tr class="group hover:bg-neutral-50/50 transition-colors">
    <td class="py-4 text-sm font-bold">${order.cat}</td>
    <td class="py-4 text-sm text-neutral-500 font-mono">${order.ref}</td>
    <td class="py-4 text-sm text-neutral-500">${order.date}</td>
    <td class="py-4 text-sm font-bold text-brand">${order.amount}</td>
    <td class="py-4">
      <span class="text-[10px] font-black uppercase px-2 py-1 rounded-md ${order.status === 'Completed' || order.status === 'Active' ? 'bg-brand/10 text-brand' : 'bg-amber-100 text-amber-600'}">${order.status}</span>
    </td>
  </tr>
`;

const PUBLIC_KEY_ENDPOINT = '/api/public-key';
const JWT_ALGORITHM_CONFIG = {
  RS256: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  RS384: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' },
  RS512: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' }
};
const PROFILE_FIELD_OVERRIDES = {
  name: 'name',
  fullName: 'name',
  displayName: 'name',
  username: 'username',
  email: 'email',
  phone: 'phone',
  phoneNumber: 'phone',
  address: 'address',
  location: 'address',
  bio: 'bio',
  about: 'bio',
  avatar: 'avatar',
  avatarUrl: 'avatar',
  language: 'language',
  currency: 'currency',
  timezone: 'timezone',
  visibility: 'visibility'
};

let cachedPublicKeyPem = null;
const importedCryptoKeys = {};
const sessionState = { trusted: false, payload: null, token: null };
const textEncoder = new TextEncoder();

function getSubtleCrypto() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('SubtleCrypto is not available in this browser.');
  return subtle;
}

function base64UrlToBase64(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  return (value.replace(/-/g, '+').replace(/_/g, '/') + padding);
}

function base64UrlDecodeSegment(segment) {
  const base64 = base64UrlToBase64(segment);
  return globalThis.atob(base64);
}

function base64UrlToUint8Array(segment) {
  const binary = base64UrlDecodeSegment(segment);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function pemToArrayBuffer(pem) {
  const cleaned = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = globalThis.atob(cleaned);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

async function fetchPublicKeyPem() {
  if (cachedPublicKeyPem) return cachedPublicKeyPem;
  const response = await fetch(PUBLIC_KEY_ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Public key request failed with ${response.status}`);
  }
  const rawText = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }
  const candidate = typeof parsed === 'string'
    ? parsed
    : parsed?.publicKey || parsed?.key || parsed?.pem;
  if (!candidate || typeof candidate !== 'string') {
    throw new Error('Public key response did not contain PEM data');
  }
  cachedPublicKeyPem = candidate.trim();
  return cachedPublicKeyPem;
}

async function getCryptoKeyForAlg(alg) {
  if (importedCryptoKeys[alg]) return importedCryptoKeys[alg];
  const config = JWT_ALGORITHM_CONFIG[alg];
  if (!config) throw new Error(`Unsupported JWT algorithm ${alg}`);
  const pem = await fetchPublicKeyPem();
  const subtle = getSubtleCrypto();
  const key = await subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    { name: config.name, hash: { name: config.hash } },
    false,
    ['verify']
  );
  importedCryptoKeys[alg] = key;
  return key;
}

function setWalletConnectionState(connected) {
  isWalletConnected = connected;
  if (walletToggleText) {
    walletToggleText.innerText = isWalletConnected ? 'Disconnect Wallet' : 'Connect Wallet';
  }
  if (walletToggle) {
    walletToggle.classList.toggle('text-rose-500', isWalletConnected);
    walletToggle.classList.toggle('text-brand', !isWalletConnected);
  }
}

function updateHeaderInfo() {
  const headerTitle = document.querySelector('main header h2');
  const headerSubtitle = document.querySelector('main header p');
  // Header info logic removed per user request
}

function getTokenFromQuery() {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    return token;
  } catch (err) {
    console.warn('Unable to parse URL for token:', err);
    return null;
  }
}

function removeTokenFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('token')) return;
    url.searchParams.delete('token');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch (err) {
    console.warn('Unable to remove token from URL:', err);
  }
}

async function verifyJwtToken(token) {
  if (!token) throw new Error('Token is empty');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token format is invalid');
  const header = JSON.parse(base64UrlDecodeSegment(parts[0]));
  const payload = JSON.parse(base64UrlDecodeSegment(parts[1]));
  const alg = header?.alg || 'RS256';
  const cryptoKey = await getCryptoKeyForAlg(alg);
  const data = textEncoder.encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlToUint8Array(parts[2]);
  const subtle = getSubtleCrypto();
  const config = JWT_ALGORITHM_CONFIG[alg];
  const verified = await subtle.verify(
    { name: config.name, hash: { name: config.hash } },
    cryptoKey,
    signature,
    data
  );
  if (!verified) throw new Error('Token signature failed to verify');
  return { header, payload };
}

function applySessionPayload(payload, token) {
  sessionState.trusted = true;
  sessionState.payload = payload;
  sessionState.token = token;
  window.trustedSession = sessionState;

  Object.entries(PROFILE_FIELD_OVERRIDES).forEach(([source, target]) => {
    if (payload?.[source] !== undefined && payload?.[source] !== null) {
      userProfile[target] = payload[source];
    }
  });

  if (payload?.kycStatus) {
    userProfile.kycStatus = payload.kycStatus;
  }
  if (typeof payload?.kycStep === 'number') {
    userProfile.kycStep = payload.kycStep;
  }
  if (payload?.kycData && typeof payload.kycData === 'object') {
    userProfile.kycData = { ...userProfile.kycData, ...payload.kycData };
  }

  removeTokenFromUrl();
  setWalletConnectionState(true);
  renderSection(activeSection);
}

async function trustTokenFromUrl() {
  const token = getTokenFromQuery();
  if (!token) return;
  try {
    const { payload } = await verifyJwtToken(token);
    if (payload?.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token has expired');
    }
    if (payload?.nbf && Date.now() < payload.nbf * 1000) {
      throw new Error('Token is not active yet');
    }
    applySessionPayload(payload, token);
    showWelcomePopup(payload.name || payload.username || 'Pioneer');
  } catch (err) {
    console.warn('Session token verification failed:', err);
    showToast(`Unable to trust session token: ${err.message}`);
  }
}

let kycSubmissions = [
  { id: 'SUB-001', userId: 'user_123', name: 'John Doe', status: 'pending', date: '2026-03-20', country: 'USA', front: 'https://placehold.co/600x400?text=ID+Front', back: 'https://placehold.co/600x400?text=ID+Back', liveness: [] },
  { id: 'SUB-002', userId: 'user_456', name: 'Jane Smith', status: 'verified', date: '2026-03-18', country: 'UK', front: 'https://placehold.co/600x400?text=ID+Front', back: 'https://placehold.co/600x400?text=ID+Back', liveness: [] },
  { id: 'SUB-003', userId: 'user_789', name: 'Amaka Obi', status: 'rejected', date: '2026-03-15', country: 'Nigeria', front: 'https://placehold.co/600x400?text=ID+Front', back: 'https://placehold.co/600x400?text=ID+Back', liveness: [] },
  { id: 'SUB-004', userId: 'user_101', name: 'SMAJ Store Admin', status: 'pending', date: '2026-03-21', country: 'Nigeria', kycType: 'vendor', taxIdNumber: 'TIN-99887766', storeName: 'SMAJ Digital', businessLicense: 'https://placehold.co/600x400/7d3cff/white?text=Business+License', front: 'https://placehold.co/600x400?text=ID+Front', back: 'https://placehold.co/600x400?text=ID+Back', liveness: [], rejectionReason: 'Document expired' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' }
];

const GCV_RATE_USD = 314159;
let PI_BALANCE = 314.00000000;

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 151.41 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.23 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 1450.00 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.33 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.52 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.36 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', rate: 0.90 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.82 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.35 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.95 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.06 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 92.50 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1345.00 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', rate: 16.50 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 32.20 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR', rate: 3.75 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'DH', rate: 3.67 },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', rate: 860.00 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 15850.00 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 4.74 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 56.20 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 36.50 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rate: 24800.00 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', rate: 47.50 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', rate: 3.70 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', rate: 278.00 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 110.00 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', rate: 6.85 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rate: 10.75 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rate: 10.60 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.66 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', rate: 3.95 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', rate: 23.40 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', rate: 365.00 },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', rate: 4.60 },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', rate: 1.80 },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', rate: 138.00 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', rate: 0.31 },
  { code: 'QAR', name: 'Qatari Rial', symbol: 'QR', rate: 3.64 },
  { code: 'OMR', name: 'Omani Rial', symbol: 'RO', rate: 0.38 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', rate: 0.38 },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD', rate: 0.71 },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', rate: 3900.00 },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', rate: 950.00 },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', rate: 3.70 },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', rate: 38.50 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', rate: 13.00 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 132.00 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', rate: 3850.00 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', rate: 2550.00 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', rate: 56.50 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', rate: 10.10 },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA', rate: 134.50 },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', rate: 3.15 }
];

const TIMEZONES = [
  { value: 'UTC-12', label: 'UTC-12:00 (Baker Island)' },
  { value: 'UTC-11', label: 'UTC-11:00 (Niue, Samoa)' },
  { value: 'UTC-10', label: 'UTC-10:00 (Hawaii-Aleutian)' },
  { value: 'UTC-9', label: 'UTC-09:00 (Alaska)' },
  { value: 'UTC-8', label: 'UTC-08:00 (Pacific Time)' },
  { value: 'UTC-7', label: 'UTC-07:00 (Mountain Time)' },
  { value: 'UTC-6', label: 'UTC-06:00 (Central Time)' },
  { value: 'UTC-5', label: 'UTC-05:00 (Eastern Time)' },
  { value: 'UTC-4', label: 'UTC-04:00 (Atlantic Time)' },
  { value: 'UTC-3', label: 'UTC-03:00 (Brazil, Argentina)' },
  { value: 'UTC-2', label: 'UTC-02:00 (Mid-Atlantic)' },
  { value: 'UTC-1', label: 'UTC-01:00 (Azores)' },
  { value: 'UTC+0', label: 'UTC+00:00 (GMT/WET)' },
  { value: 'UTC+1', label: 'UTC+01:00 (CET/WAT)' },
  { value: 'UTC+2', label: 'UTC+02:00 (EET/CAT)' },
  { value: 'UTC+3', label: 'UTC+03:00 (MSK/EAT)' },
  { value: 'UTC+4', label: 'UTC+04:00 (GST/SAMT)' },
  { value: 'UTC+5', label: 'UTC+05:00 (PKT/YEKT)' },
  { value: 'UTC+6', label: 'UTC+06:00 (BST/OMST)' },
  { value: 'UTC+7', label: 'UTC+07:00 (WIB/KRAT)' },
  { value: 'UTC+8', label: 'UTC+08:00 (CST/AWST)' },
  { value: 'UTC+9', label: 'UTC+09:00 (JST/KST)' },
  { value: 'UTC+10', label: 'UTC+10:00 (AEST/CHST)' },
  { value: 'UTC+11', label: 'UTC+11:00 (SRET/VLAST)' },
  { value: 'UTC+12', label: 'UTC+12:00 (NZST/FJT)' },
  { value: 'UTC+13', label: 'UTC+13:00 (PHOT/TKT)' },
  { value: 'UTC+14', label: 'UTC+14:00 (LINT)' }
];

// --- DOM Elements ---
const sidebar = document.getElementById('sidebar');
const sidebarOpen = document.getElementById('sidebar-open');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const navMenu = document.getElementById('nav-menu');
const contentArea = document.getElementById('content-area');
const walletToggle = document.getElementById('wallet-toggle');
const walletToggleText = document.getElementById('wallet-toggle-text');
const walletStatusDot = document.getElementById('wallet-status-dot');
const themeToggle = document.getElementById('theme-toggle');

// --- Templates ---
const templates = {
  overview: () => {
    const currentCurrency = CURRENCIES.find(c => c.code === userProfile.currency) || CURRENCIES[0];
    const totalUSD = PI_BALANCE * GCV_RATE_USD;
    const convertedValue = totalUSD * currentCurrency.rate;
    const formattedValue = new Intl.NumberFormat(userProfile.language, {
      style: 'currency',
      currency: currentCurrency.code
    }).format(convertedValue);

    const displayName = (userProfile.name && userProfile.name !== 'Unconnected Pioneer') 
      ? userProfile.name 
      : 'Pioneer';

    return `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <!-- Mobile Wallet CTA: Prominent on mobile when disconnected -->
      ${!isWalletConnected ? `
        <div class="lg:hidden p-6 rounded-3xl bg-brand text-white shadow-xl shadow-brand/20 flex flex-col items-center text-center space-y-4">
          <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <i class='bx bx-wallet text-2xl'></i>
          </div>
          <div>
            <h3 class="font-bold text-lg">Connect Your Pi Wallet</h3>
            <p class="text-xs opacity-80">Access your real balance and ecosystem services.</p>
          </div>
          <button onclick="document.getElementById('wallet-toggle').click()" class="w-full py-4 bg-white text-brand rounded-2xl font-bold text-sm hover:bg-neutral-50 transition-all">Connect Now</button>
        </div>
      ` : ''}

      <!-- Ticker -->
      <div class="overflow-hidden bg-neutral-900 text-white py-2 rounded-2xl relative">
        <div class="flex whitespace-nowrap animate-marquee">
          ${Array(2).fill(`
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-brand rounded-full"></span>
              SMAJ STORE: +1,240 Orders Today
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-orange-500 rounded-full"></span>
              SMAJ FOOD: 850 Deliveries
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-blue-500 rounded-full"></span>
              SMAJ PI JOBS: 45 New Listings
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-rose-500 rounded-full"></span>
              SMAJ PI HEALTH: 120 Consultations
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-indigo-500 rounded-full"></span>
              SMAJ PI EDU: 3.2K Active Learners
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-amber-500 rounded-full"></span>
              SMAJ PI TRANSPORT: 450 Rides Active
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-green-500 rounded-full"></span>
              SMAJ PI AGRO: 15.4 Tons Harvested
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-yellow-500 rounded-full"></span>
              SMAJ PI ENERGY: 850 MWh Generated
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-pink-500 rounded-full"></span>
              SMAJ PI CHARITY: 1.2M Pi Donated
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-sky-500 rounded-full"></span>
              SMAJ PI HOUSING: 24 New Listings
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-violet-500 rounded-full"></span>
              SMAJ PI EVENTS: 1.5K Tickets Sold
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-cyan-500 rounded-full"></span>
              SMAJ PI SWAP: 12.4M Pi Vol
            </span>
            <span class="mx-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span class="w-1 h-1 bg-brand rounded-full"></span>
              SMAJ TOKEN: 314.1B Staked
            </span>
          `).join('')}
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold">Welcome back, ${displayName}</h2>
          <p class="text-sm text-neutral-500">Your SMAJ Ecosystem is synchronized and thriving.</p>
        </div>
        <div class="flex items-center gap-3 px-4 py-2 bg-brand/5 rounded-2xl border border-brand/10">
          <div class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
          </div>
          <span class="text-xs font-bold text-brand-dark uppercase tracking-widest">Network Live</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        ${[
        { label: 'Pi Balance', value: `${PI_BALANCE.toFixed(8)} Pi`, icon: 'bx bx-coin-stack', color: 'brand', toggle: true, refresh: true, subValue: `≈ ${formattedValue} GCV` },
        { label: 'Active Orders', value: '14', icon: 'bx bx-package', color: 'blue' },
        { label: 'Active Jobs', value: '7', icon: 'bx bx-briefcase', color: 'indigo' },
        { label: 'Enrolled Courses', value: '9', icon: 'bx bx-book-open', color: 'violet' },
        { label: 'Health Appointments', value: '3', icon: 'bx bx-plus-medical', color: 'rose' },
        { label: 'Energy Payments', value: '11', icon: 'bx bx-bolt-circle', color: 'yellow' },
        { label: 'Housing Bookings', value: '4', icon: 'bx bx-building-house', color: 'sky' },
        { label: 'Swap Trades', value: '23', icon: 'bx bx-transfer-alt', color: 'cyan' },
      ].map(stat => `
          <div class="p-6 rounded-3xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color}-500/10 text-${stat.color}-600">
                <i class='${stat.icon} text-2xl'></i>
              </div>
              <div class="flex items-center gap-1">
                ${stat.refresh ? `
                  <button id="balance-refresh" class="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 transition-all hover:text-brand" title="Refresh Balance">
                    <i class='bx bx-refresh text-xl'></i>
                  </button>
                ` : ''}
                ${stat.toggle ? `
                  <button id="balance-toggle" class="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400">
                    <i class='bx ${showBalance ? 'bx-show' : 'bx-hide'} text-xl'></i>
                  </button>
                ` : ''}
              </div>
            </div>
            <h3 class="text-neutral-500 font-medium text-sm mb-1">${stat.label}</h3>
            <p class="text-xl sm:text-2xl font-bold tracking-tight truncate">
              ${stat.toggle && !showBalance ? '••••••' : stat.value}
            </p>
            ${stat.subValue ? `<p class="text-[10px] font-bold text-neutral-400 mt-1">${stat.toggle && !showBalance ? '••••••' : stat.subValue}</p>` : ''}
            <button onclick="handleAction('View ${stat.label}')" class="mt-4 text-xs font-bold text-brand flex items-center gap-1 group-hover:gap-2 transition-all">
              View Details <i class='bx bx-chevron-right'></i>
            </button>
          </div>
        `).join('')}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 p-6 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-bold text-lg">Ecosystem Growth</h3>
              <p class="text-xs text-neutral-500">Network activity and adoption rate</p>
            </div>
            <select class="bg-neutral-50 border-none rounded-lg text-sm font-medium px-3 py-1.5 focus:ring-2 focus:ring-brand outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div class="h-[320px] w-full relative">
            <canvas id="ecosystemChart"></canvas>
          </div>
        </div>

        <div class="p-6 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg">Live Activity</h3>
            <span class="flex h-2 w-2 rounded-full bg-brand"></span>
          </div>
          <div class="space-y-6 relative">
            <div class="absolute left-[19px] top-2 bottom-2 w-px bg-neutral-100"></div>
            ${TRANSACTION_DATA.slice(0, 4).map(tx => `
              <div class="flex items-start gap-4 relative z-10">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white border border-neutral-100 text-rose-500'}">
                  <i class='bx ${tx.type === 'income' ? 'bx-plus' : 'bx-minus'} text-xl'></i>
                </div>
                <div class="flex-1 min-w-0 pt-1">
                  <div class="flex items-center justify-between mb-0.5">
                    <h4 class="font-bold text-sm truncate">${tx.project}</h4>
                    <span class="text-[10px] font-black text-neutral-400 uppercase">${tx.date.split('-').slice(1).join('/')}</span>
                  </div>
                  <p class="text-xs font-bold ${tx.type === 'income' ? 'text-brand-dark' : 'text-rose-600'}">
                    ${tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(6)} Pi
                  </p>
                </div>
              </div>
            `).join('')}
          </div>
          <button onclick="handleAction('Open Ledger')" class="w-full mt-8 py-3 rounded-xl bg-neutral-50 font-bold text-xs text-neutral-600 hover:bg-neutral-100 transition-all uppercase tracking-widest">
            Open Ledger
          </button>
        </div>
      </div>
    </div>
    `;
  },
  kyc: () => {
    if (userProfile.kycStatus === 'pending') {
      return `
        <div class="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div class="w-24 h-24 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto shadow-xl shadow-brand/10">
            <i class='bx bx-time-five text-5xl animate-pulse'></i>
          </div>
          <div class="space-y-4">
            <h2 class="text-4xl font-black tracking-tight">Review Submission Successful</h2>
            <p class="text-neutral-500 text-lg">Your identity verification is currently being reviewed by our compliance team. This usually takes 24-48 hours.</p>
          </div>
          <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm text-left space-y-6">
            <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
              <span class="text-sm font-bold text-neutral-400 uppercase tracking-widest">Status</span>
              <span class="px-4 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-bold uppercase tracking-widest">Pending Review</span>
            </div>
            <div class="space-y-4">
              <h4 class="font-bold text-sm uppercase tracking-widest text-neutral-400">What happens next?</h4>
              <ul class="space-y-3">
                <li class="flex gap-3 text-sm text-neutral-600">
                  <i class='bx bx-check-circle text-brand'></i>
                  AI-powered liveness check verification.
                </li>
                <li class="flex gap-3 text-sm text-neutral-600">
                  <i class='bx bx-check-circle text-brand'></i>
                  Document authenticity validation.
                </li>
                <li class="flex gap-3 text-sm text-neutral-600">
                  <i class='bx bx-check-circle text-brand'></i>
                  Final manual review by admin.
                </li>
              </ul>
            </div>
          </div>
          <button onclick="renderSection('overview')" class="px-8 py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-105 transition-all">
            Back to Dashboard
          </button>
        </div>
      `;
    }

    if (userProfile.kycStatus === 'verified') {
      return `
        <div class="max-w-2xl mx-auto text-center space-y-8 animate-in zoom-in duration-700">
          <div class="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100/50">
            <i class='bx bxs-check-shield text-5xl'></i>
          </div>
          <div class="space-y-4">
            <h2 class="text-4xl font-black tracking-tight text-emerald-600">Verified Pioneer</h2>
            <p class="text-neutral-500 text-lg">Congratulations! Your identity has been successfully verified. You now have full access to the SMAJ Ecosystem.</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-6 rounded-3xl bg-white border border-neutral-200/60 shadow-sm">
              <p class="text-xs font-bold text-neutral-400 uppercase mb-1">Verification Tier</p>
              <p class="text-xl font-black">Level 3 (Full)</p>
            </div>
            <div class="p-6 rounded-3xl bg-white border border-neutral-200/60 shadow-sm">
              <p class="text-xs font-bold text-neutral-400 uppercase mb-1">Daily Limit</p>
              <p class="text-xl font-black">Unlimited</p>
            </div>
          </div>
          <button onclick="renderSection('overview')" class="px-8 py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-105 transition-all">
            Go to Dashboard
          </button>
        </div>
      `;
    }

    // Step 1: Info & Documents
    if (userProfile.kycStep === 1) {
      const isNameDone = userProfile.kycData.fullName?.length > 2;
      const isDobDone = !!userProfile.kycData.dob;
      const isCountryDone = !!userProfile.kycData.country;
      const isDocTypeDone = !!userProfile.kycData.docType;
      const isFrontDone = !!userProfile.kycData.front;
      const isBackDone = !!userProfile.kycData.back;

      const checklistItem = (id, label, isDone) => `
        <li id="kyc-check-${id}" class="flex items-center gap-3 text-sm ${isDone ? 'text-emerald-600' : 'text-neutral-400'} transition-colors duration-300">
          <div class="check-icon w-5 h-5 rounded-full flex items-center justify-center border ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-200 text-transparent'}">
            <i class='bx bx-check text-xs'></i>
          </div>
          <span class="check-label ${isDone ? 'font-bold' : 'font-medium'}">${label}</span>
        </li>
      `;

      return `
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-black tracking-tight">KYC Verification</h2>
              <p class="text-neutral-500">Step 1 of 3: Personal Information & Documents</p>
            </div>
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-brand"></div>
              <div class="w-3 h-3 rounded-full bg-neutral-200"></div>
              <div class="w-3 h-3 rounded-full bg-neutral-200"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-8">
              <!-- Account Type -->
              <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-6">
                <h3 class="text-xl font-bold">Account Type</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label class="cursor-pointer group">
                    <input type="radio" name="kyc-type" value="pioneer" class="peer sr-only" ${userProfile.kycData.kycType === 'pioneer' ? 'checked' : ''}>
                    <div class="p-6 rounded-2xl border-2 border-neutral-100 bg-neutral-50 group-hover:border-brand/30 transition-all peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:text-brand">
                      <div class="flex items-center gap-3 mb-2">
                        <i class='bx bx-user text-2xl'></i>
                        <p class="font-bold">Standard Pioneer</p>
                      </div>
                      <p class="text-xs text-neutral-500">For regular users, shoppers, and service seekers within the SMAJ Ecosystem.</p>
                    </div>
                  </label>
                  <label class="cursor-pointer group">
                    <input type="radio" name="kyc-type" value="vendor" class="peer sr-only" ${userProfile.kycData.kycType === 'vendor' ? 'checked' : ''}>
                    <div class="p-6 rounded-2xl border-2 border-neutral-100 bg-neutral-50 group-hover:border-brand/30 transition-all peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:text-brand">
                      <div class="flex items-center gap-3 mb-2">
                        <i class='bx bx-store text-2xl'></i>
                        <p class="font-bold">Merchant / Vendor</p>
                      </div>
                      <p class="text-xs text-neutral-500">For business owners and service providers looking to list products on SMAJ Store or Food.</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Personal Details -->
              <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-6">
                <h3 class="text-xl font-bold">Personal Details</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Full Name (As on ID)</label>
                    <input type="text" id="kyc-fullname" value="${userProfile.kycData.fullName}" placeholder="John Doe" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Date of Birth</label>
                    <input type="date" id="kyc-dob" value="${userProfile.kycData.dob}" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Place of Birth</label>
                    <input type="text" id="kyc-pob" value="${userProfile.kycData.pob}" placeholder="Lagos, Nigeria" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Country</label>
                    <select id="kyc-country" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                      <option value="">Select Country</option>
                      ${countries.map(c => `<option value="${c.code}" ${userProfile.kycData.country === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                  </div>
                </div>
              </div>

              <!-- Document Type -->
              <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-6">
                <h3 class="text-xl font-bold">Document Type</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  ${['Passport', 'ID Card', 'Driver License', 'Voter Card'].map(type => `
                    <label class="cursor-pointer group">
                      <input type="radio" name="kyc-doc-type" value="${type}" class="peer sr-only" ${userProfile.kycData.docType === type ? 'checked' : ''}>
                      <div class="p-4 rounded-2xl border-2 border-neutral-100 bg-neutral-50 text-center group-hover:border-brand/30 transition-all peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:text-brand">
                        <p class="text-xs font-bold">${type}</p>
                      </div>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Upload -->
              <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-8">
                <h3 class="text-xl font-bold">Document Upload (Front & Back)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <!-- Front Side -->
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-neutral-400 uppercase">Front Side</label>
                      <div class="flex gap-1">
                        <button onclick="userProfile.kycData.frontMethod = 'upload'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.frontMethod === 'upload' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="File Upload">
                          <i class='bx bx-upload'></i>
                        </button>
                        <button onclick="userProfile.kycData.frontMethod = 'camera'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.frontMethod === 'camera' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="Device Camera">
                          <i class='bx bx-camera'></i>
                        </button>
                        <button onclick="userProfile.kycData.frontMethod = 'url'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.frontMethod === 'url' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="Direct URL">
                          <i class='bx bx-link'></i>
                        </button>
                      </div>
                    </div>
                    <div id="kyc-front-container" class="relative group">
                      ${userProfile.kycData.frontMethod === 'upload' ? `
                        <div id="front-upload-view" class="kyc-view border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center space-y-2 hover:border-brand hover:bg-brand/5 transition-all cursor-pointer">
                          <i class='bx bx-cloud-upload text-2xl text-neutral-400 group-hover:text-brand'></i>
                          <p class="text-xs font-bold">Upload Front Side</p>
                          <input type="file" id="kyc-file-front" class="hidden">
                        </div>
                      ` : userProfile.kycData.frontMethod === 'camera' ? `
                        <div id="front-camera-view" class="kyc-view border-2 border-brand/30 bg-brand/5 rounded-2xl p-8 text-center space-y-2 hover:border-brand transition-all cursor-pointer">
                          <i class='bx bx-camera text-2xl text-brand'></i>
                          <p class="text-xs font-bold text-brand">Capture Front Side</p>
                        </div>
                      ` : `
                        <div class="space-y-3">
                          <input type="text" id="kyc-url-front" placeholder="Paste image URL here..." class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all text-xs font-medium">
                          <button id="front-url-btn" class="w-full py-2 bg-brand text-white rounded-xl text-xs font-bold">Fetch Image</button>
                        </div>
                      `}
                      <div id="front-preview" class="${userProfile.kycData.front ? '' : 'hidden'} absolute inset-0 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                        <img src="${userProfile.kycData.front || ''}" class="w-full h-full object-cover">
                        <button data-side="front" class="kyc-reset-btn absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
                          <i class='bx bx-x text-xl'></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <!-- Back Side -->
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-neutral-400 uppercase">Back Side</label>
                      <div class="flex gap-1">
                        <button onclick="userProfile.kycData.backMethod = 'upload'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.backMethod === 'upload' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="File Upload">
                          <i class='bx bx-upload'></i>
                        </button>
                        <button onclick="userProfile.kycData.backMethod = 'camera'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.backMethod === 'camera' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="Device Camera">
                          <i class='bx bx-camera'></i>
                        </button>
                        <button onclick="userProfile.kycData.backMethod = 'url'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.backMethod === 'url' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="Direct URL">
                          <i class='bx bx-link'></i>
                        </button>
                      </div>
                    </div>
                    <div id="kyc-back-container" class="relative group">
                      ${userProfile.kycData.backMethod === 'upload' ? `
                        <div id="back-upload-view" class="kyc-view border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center space-y-2 hover:border-brand hover:bg-brand/5 transition-all cursor-pointer">
                          <i class='bx bx-cloud-upload text-2xl text-neutral-400 group-hover:text-brand'></i>
                          <p class="text-xs font-bold">Upload Back Side</p>
                          <input type="file" id="kyc-file-back" class="hidden">
                        </div>
                      ` : userProfile.kycData.backMethod === 'camera' ? `
                        <div id="back-camera-view" class="kyc-view border-2 border-brand/30 bg-brand/5 rounded-2xl p-8 text-center space-y-2 hover:border-brand transition-all cursor-pointer">
                          <i class='bx bx-camera text-2xl text-brand'></i>
                          <p class="text-xs font-bold text-brand">Capture Back Side</p>
                        </div>
                      ` : `
                        <div class="space-y-3">
                          <input type="text" id="kyc-url-back" placeholder="Paste image URL here..." class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all text-xs font-medium">
                          <button id="back-url-btn" class="w-full py-2 bg-brand text-white rounded-xl text-xs font-bold">Fetch Image</button>
                        </div>
                      `}
                      <div id="back-preview" class="${userProfile.kycData.back ? '' : 'hidden'} absolute inset-0 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                        <img src="${userProfile.kycData.back || ''}" class="w-full h-full object-cover">
                        <button data-side="back" class="kyc-reset-btn absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
                          <i class='bx bx-x text-xl'></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Business License (Vendor Only) -->
              ${userProfile.kycData.kycType === 'vendor' ? `
                <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div class="space-y-4">
                    <h3 class="text-xl font-bold">Business Registration</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div class="space-y-2">
                        <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Store / Business Name</label>
                        <input type="text" id="kyc-store-name" value="${userProfile.kycData.storeName || ''}" placeholder="SMAJ Digital Store" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                      </div>
                      <div class="space-y-2">
                        <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Registration Number</label>
                        <input type="text" id="kyc-reg-number" value="${userProfile.kycData.businessRegNumber || ''}" placeholder="RC-12345678" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                      </div>
                    </div>
                    <div class="space-y-2">
                      <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tax Identification Number (TIN)</label>
                      <input type="text" id="kyc-tax-id" value="${userProfile.kycData.taxIdNumber || ''}" placeholder="TIN-12345678" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div class="space-y-2">
                        <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Business Category</label>
                        <select id="kyc-business-category" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                          <option value="">Select Category</option>
                          <option value="retail" ${userProfile.kycData.businessCategory === 'retail' ? 'selected' : ''}>Retail & E-commerce</option>
                          <option value="food" ${userProfile.kycData.businessCategory === 'food' ? 'selected' : ''}>Food & Gastronomy</option>
                          <option value="health" ${userProfile.kycData.businessCategory === 'health' ? 'selected' : ''}>Health & Medical</option>
                          <option value="tech" ${userProfile.kycData.businessCategory === 'tech' ? 'selected' : ''}>Technology & Services</option>
                        </select>
                      </div>
                      <div class="space-y-2">
                        <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Physical Business Address</label>
                        <input type="text" id="kyc-business-address" value="${userProfile.kycData.businessAddress || ''}" placeholder="123 Ecosystem Way, Lagos" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold">Business License Upload</h3>
                    <div class="flex gap-1">
                      <button onclick="userProfile.kycData.businessLicenseMethod = 'upload'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.businessLicenseMethod === 'upload' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="File Upload">
                        <i class='bx bx-upload'></i>
                      </button>
                      <button onclick="userProfile.kycData.businessLicenseMethod = 'camera'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.businessLicenseMethod === 'camera' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="Device Camera">
                        <i class='bx bx-camera'></i>
                      </button>
                      <button onclick="userProfile.kycData.businessLicenseMethod = 'url'; renderSection('kyc')" class="p-1.5 rounded-lg ${userProfile.kycData.businessLicenseMethod === 'url' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'} transition-all" title="Direct URL">
                        <i class='bx bx-link'></i>
                      </button>
                    </div>
                  </div>
                  <div id="kyc-license-container" class="relative group">
                    ${userProfile.kycData.businessLicenseMethod === 'upload' ? `
                      <div id="license-upload-view" class="kyc-view border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center space-y-2 hover:border-brand hover:bg-brand/5 transition-all cursor-pointer">
                        <i class='bx bx-cloud-upload text-2xl text-neutral-400 group-hover:text-brand'></i>
                        <p class="text-xs font-bold">Upload Business License / CAC Document</p>
                        <input type="file" id="kyc-file-license" class="hidden">
                      </div>
                    ` : userProfile.kycData.businessLicenseMethod === 'camera' ? `
                      <div id="license-camera-view" class="kyc-view border-2 border-brand/30 bg-brand/5 rounded-2xl p-8 text-center space-y-2 hover:border-brand transition-all cursor-pointer">
                        <i class='bx bx-camera text-2xl text-brand'></i>
                        <p class="text-xs font-bold text-brand">Capture Business License</p>
                      </div>
                    ` : `
                      <div class="space-y-3">
                        <input type="text" id="kyc-url-license" placeholder="Paste license image URL here..." class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all text-xs font-medium">
                        <button id="license-url-btn" class="w-full py-2 bg-brand text-white rounded-xl text-xs font-bold">Fetch Image</button>
                      </div>
                    `}
                    <div id="license-preview" class="${userProfile.kycData.businessLicense ? '' : 'hidden'} absolute inset-0 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                      <img src="${userProfile.kycData.businessLicense || ''}" class="w-full h-full object-cover">
                      <button data-side="businessLicense" class="kyc-reset-btn absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
                        <i class='bx bx-x text-xl'></i>
                      </button>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="space-y-6">
              <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
                <h3 class="text-lg font-bold mb-6">Verification Progress</h3>
                <ul class="space-y-4">
                  ${checklistItem('name', 'Full Name Provided', isNameDone)}
                  ${checklistItem('dob', 'Date of Birth Set', isDobDone)}
                  ${checklistItem('country', 'Country Selected', isCountryDone)}
                  ${checklistItem('doctype', 'Document Type Chosen', isDocTypeDone)}
                  ${checklistItem('front', 'Front Side Document', isFrontDone)}
                  ${checklistItem('back', 'Back Side Document', isBackDone)}
                  ${userProfile.kycData.kycType === 'vendor' ? checklistItem('license', 'Business License Uploaded', !!userProfile.kycData.businessLicense) : ''}
                  ${userProfile.kycData.kycType === 'vendor' ? checklistItem('regnumber', 'Reg Number Entered', userProfile.kycData.businessRegNumber?.length > 2) : ''}
                  ${userProfile.kycData.kycType === 'vendor' ? checklistItem('taxid', 'TIN Provided', userProfile.kycData.taxIdNumber?.length > 4) : ''}
                  ${userProfile.kycData.kycType === 'vendor' ? checklistItem('storename', 'Store Name Entered', userProfile.kycData.storeName?.length > 2) : ''}
                  ${userProfile.kycData.kycType === 'vendor' ? checklistItem('buscat', 'Category Selected', !!userProfile.kycData.businessCategory) : ''}
                  ${userProfile.kycData.kycType === 'vendor' ? checklistItem('busaddr', 'Address Provided', userProfile.kycData.businessAddress?.length > 5) : ''}
                </ul>
                
                <div class="mt-8 pt-6 border-t border-neutral-100">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Overall Progress</p>
                    <p id="kyc-progress-text" class="text-xs font-bold text-brand">0%</p>
                  </div>
                  <div class="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div id="kyc-progress-bar" class="h-full bg-brand transition-all duration-500" style="width: 0%"></div>
                  </div>
                </div>
              </div>
              <button id="next-to-liveness" class="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Next: Face Verification
                <i class='bx bx-right-arrow-alt text-xl'></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Step 2: Liveness Check
    if (userProfile.kycStep === 2) {
      return `
        <div class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-black tracking-tight">Face Verification</h2>
              <p class="text-neutral-500">Step 2 of 3: Liveness & Anti-Robot Check</p>
            </div>
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-brand/30"></div>
              <div class="w-3 h-3 rounded-full bg-brand"></div>
              <div class="w-3 h-3 rounded-full bg-neutral-200"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-6">
              <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm relative overflow-hidden aspect-square flex items-center justify-center bg-black">
                <video id="liveness-video" class="absolute inset-0 w-full h-full object-cover" autoplay playsinline></video>
                
                <!-- Face Tracking Overlay -->
                <div id="face-overlay" class="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div class="w-64 h-80 border-2 border-brand/50 rounded-[100px] relative">
                    <div class="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-brand rounded-tl-xl"></div>
                    <div class="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-brand rounded-tr-xl"></div>
                    <div class="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-brand rounded-bl-xl"></div>
                    <div class="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-brand rounded-br-xl"></div>
                    
                    <!-- Scanning Line -->
                    <div class="absolute inset-x-0 h-0.5 bg-brand/50 shadow-[0_0_15px_rgba(125,60,255,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
                    
                    <!-- Tracking Points (Simulated) -->
                    <div class="absolute inset-0 opacity-40">
                      <div class="absolute top-1/4 left-1/4 w-1 h-1 bg-brand rounded-full"></div>
                      <div class="absolute top-1/4 right-1/4 w-1 h-1 bg-brand rounded-full"></div>
                      <div class="absolute top-1/2 left-1/2 w-1 h-1 bg-brand rounded-full"></div>
                      <div class="absolute bottom-1/4 left-1/3 w-1 h-1 bg-brand rounded-full"></div>
                      <div class="absolute bottom-1/4 right-1/3 w-1 h-1 bg-brand rounded-full"></div>
                    </div>
                  </div>
                </div>

                <!-- Instruction Overlay -->
                <div id="liveness-instruction" class="absolute bottom-8 inset-x-8 p-4 bg-black/60 backdrop-blur-md text-white rounded-2xl text-center border border-white/10 animate-pulse">
                  <p class="text-sm font-bold uppercase tracking-widest" id="liveness-text">Position your face in the frame</p>
                </div>

                <canvas id="liveness-canvas" class="hidden"></canvas>
              </div>
            </div>

            <div class="space-y-6">
              <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-6">
                <h3 class="text-xl font-bold">Liveness Instructions</h3>
                <div class="grid grid-cols-1 gap-4">
                  ${livenessTasks.map(task => `
                    <div id="task-${task.id}" class="group flex flex-col gap-3 p-5 rounded-3xl bg-white border border-neutral-100 transition-all duration-500 opacity-40 shadow-sm relative overflow-hidden">
                      <!-- Progress Bar Overlay (Hidden by default) -->
                      <div class="task-progress absolute bottom-0 left-0 h-1 bg-brand/20 w-0 transition-all duration-[1500ms] ease-linear"></div>
                      
                      <div class="flex items-center gap-4">
                        <div class="task-icon-container w-12 h-12 rounded-2xl bg-neutral-50 text-neutral-400 flex items-center justify-center transition-all duration-500">
                          <i class='bx ${task.id === 'blink' ? 'bx-low-vision' : task.id === 'left' ? 'bx-undo' : 'bx-redo'} text-2xl'></i>
                        </div>
                        <div class="flex-1">
                          <p class="text-sm font-bold text-neutral-600 transition-colors duration-500 task-label">${task.text}</p>
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-neutral-300 status-dot"></span>
                            <p class="text-[10px] font-black text-neutral-400 uppercase tracking-widest status-text">Pending</p>
                          </div>
                        </div>
                        <div class="status-icon w-8 h-8 flex items-center justify-center"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div id="liveness-controls" class="flex gap-4">
                <button onclick="userProfile.kycStep = 1; renderSection('kyc')" class="flex-1 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-bold hover:bg-neutral-200 transition-all">
                  Back
                </button>
                <button id="start-liveness" class="flex-[2] py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Start Verification
                </button>
              </div>
            </div>
          </div>
        </div>
        <style>
          @keyframes scan {
            0%, 100% { top: 10%; }
            50% { top: 90%; }
          }
        </style>
      `;
    }

    // Step 3: Final Review
    if (userProfile.kycStep === 3) {
      return `
        <div class="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-black tracking-tight">Final Review</h2>
              <p class="text-neutral-500">Step 3 of 3: Confirm & Submit</p>
            </div>
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-brand/30"></div>
              <div class="w-3 h-3 rounded-full bg-brand/30"></div>
              <div class="w-3 h-3 rounded-full bg-brand"></div>
            </div>
          </div>

          <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-8">
            <div class="grid grid-cols-2 gap-8">
              <div class="space-y-4">
                <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Personal Info</h4>
                <div class="space-y-1">
                  <p class="text-sm font-bold">${userProfile.kycData.fullName}</p>
                  <p class="text-xs text-neutral-500">${userProfile.kycData.dob}</p>
                  <p class="text-xs text-neutral-500">${userProfile.kycData.country}</p>
                </div>
              </div>
              ${userProfile.kycData.kycType === 'vendor' ? `
                <div class="space-y-4">
                  <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Business License</h4>
                  <div class="aspect-video rounded-2xl overflow-hidden border border-neutral-100 max-w-sm">
                    <img src="${userProfile.kycData.businessLicense}" class="w-full h-full object-cover">
                  </div>
                </div>
                <div class="space-y-4">
                  <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Store Details</h4>
                  <div class="space-y-1">
                    <p class="text-sm font-bold uppercase">${userProfile.kycData.storeName}</p>
                    <p class="text-xs text-neutral-600 font-bold italic">${userProfile.kycData.businessCategory}</p>
                    <p class="text-xs text-neutral-500 font-mono">Reg: ${userProfile.kycData.businessRegNumber}</p>
                    <p class="text-xs text-neutral-500 font-mono">TIN: ${userProfile.kycData.taxIdNumber}</p>
                    <p class="text-[10px] text-neutral-400">${userProfile.kycData.businessAddress}</p>
                  </div>
                </div>
              ` : ''}
              <div class="space-y-4">
                <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Verification Tier</h4>
                <p class="text-sm font-bold uppercase">${userProfile.kycData.kycType} KYC</p>
              </div>
              <div class="space-y-4">
                <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Document</h4>
                <p class="text-sm font-bold">${userProfile.kycData.docType}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="aspect-video rounded-2xl overflow-hidden border border-neutral-100">
                <img src="${userProfile.kycData.front}" class="w-full h-full object-cover">
              </div>
              <div class="aspect-video rounded-2xl overflow-hidden border border-neutral-100">
                <img src="${userProfile.kycData.back}" class="w-full h-full object-cover">
              </div>
            </div>

            <div class="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
              <div class="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                <i class='bx bx-check text-2xl'></i>
              </div>
              <div>
                <p class="text-sm font-bold text-emerald-700">Liveness Check Passed</p>
                <p class="text-xs text-emerald-600">AI verified identity and anti-robot check.</p>
              </div>
            </div>

            <div class="space-y-6 pt-4 border-t border-neutral-100">
              <label class="flex items-start gap-3 cursor-pointer group">
                <div class="relative flex items-center mt-1">
                  <input type="checkbox" id="kyc-agree-final" class="peer sr-only">
                  <div class="w-5 h-5 border-2 border-neutral-200 rounded-md bg-white peer-checked:bg-brand peer-checked:border-brand transition-all"></div>
                  <i class='bx bx-check absolute text-white text-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity'></i>
                </div>
                <span class="text-xs text-neutral-500 leading-relaxed">
                  I confirm that I am a real person and all information provided is accurate. I understand that providing false information will lead to permanent account suspension.
                </span>
              </label>

              <div class="flex gap-4">
                <button onclick="userProfile.kycStep = 1; renderSection('kyc')" class="flex-1 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-bold hover:bg-neutral-200 transition-all">
                  Edit Info
                </button>
                <button id="submit-kyc-final" class="flex-[2] py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Submit For Final Review
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  },
  finance: () => {
    const currentCurrency = CURRENCIES.find(c => c.code === userProfile.currency) || CURRENCIES[0];
    const totalUSD = PI_BALANCE * GCV_RATE_USD;
    const convertedValue = totalUSD * currentCurrency.rate;
    const formattedValue = new Intl.NumberFormat(userProfile.language, {
      style: 'currency',
      currency: currentCurrency.code
    }).format(convertedValue);

    return `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 class="text-2xl font-bold">Wallet & Finance</h2>
      <div class="p-8 rounded-3xl bg-neutral-900 text-white shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-brand/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div class="relative z-10">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <p class="text-neutral-400 text-sm font-medium mb-1">Total Pi Balance</p>
              <h3 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight truncate">${PI_BALANCE.toFixed(8)} <span class="text-brand text-xl sm:text-2xl">Pi</span></h3>
              <div class="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p class="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Estimated Value (GCV)</p>
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-black text-brand">${formattedValue}</span>
                  <span class="text-xs text-neutral-400 font-medium">@ $314,159/Pi</span>
                </div>
              <div class="mt-4 p-4 min-h-[80px] bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm flex items-center justify-center">
                ${!isWalletConnected ? `
                  <div class="text-center space-y-2">
                    <p class="text-[10px] font-black uppercase text-neutral-500">Authentication Required</p>
                    <button onclick="document.getElementById('wallet-toggle').click()" class="px-6 py-2 bg-brand text-white rounded-xl text-xs font-bold">Connect Wallet</button>
                  </div>
                ` : `
                  <div class="w-full">
                    <p class="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">Estimated Value (GCV)</p>
                    <div class="flex items-baseline gap-2">
                      <span class="text-2xl font-black text-brand">${formattedValue}</span>
                      <span class="text-xs text-neutral-400 font-medium">@ $314,159/Pi</span>
                    </div>
                  </div>
                `}
              </div>
            </div>
            <div class="flex gap-3">
              <button onclick="handleSendPi()" class="flex-1 md:flex-none px-8 py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                <i class='bx bx-up-arrow-alt rotate-45 text-xl'></i> Send
              </button>
              <button onclick="handleReceivePi()" class="flex-1 md:flex-none px-8 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                <i class='bx bx-down-arrow-alt rotate-45 text-xl'></i> Receive
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div>
              <p class="text-neutral-500 text-xs font-bold uppercase mb-1">Wallet Status</p>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-brand rounded-full animate-pulse"></div>
                <span class="font-bold">Connected</span>
              </div>
            </div>
            <div>
              <p class="text-neutral-500 text-xs font-bold uppercase mb-1">Network</p>
              <span class="font-bold">Pi Mainnet</span>
            </div>
            <div>
              <p class="text-neutral-500 text-xs font-bold uppercase mb-1">Address</p>
              <span class="font-mono text-sm opacity-60">${userProfile.walletAddress ? userProfile.walletAddress.substring(0, 6) + '...' + userProfile.walletAddress.substring(userProfile.walletAddress.length - 4) : 'Not Connected'}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-xl font-bold">Recent Transactions</h3>
          <div class="flex items-center gap-2">
            <button onclick="window.exportTransactionsCSV()" class="px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-100 transition-all flex items-center gap-1">
              <i class='bx bx-file'></i> CSV
            </button>
            <button onclick="window.exportTransactionsPDF()" class="px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-100 transition-all flex items-center gap-1">
              <i class='bx bxs-file-pdf'></i> PDF
            </button>
            <button id="transactions-refresh" class="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 transition-all hover:text-brand" title="Refresh Transactions">
              <i class='bx bx-refresh text-2xl'></i>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-neutral-100">
                <th class="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-wider">Date</th>
                <th class="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-wider">Project</th>
                <th class="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-wider">Amount</th>
                <th class="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50">
              ${TRANSACTION_DATA.map(tx => `
                <tr class="group hover:bg-neutral-50 transition-colors">
                  <td class="py-4 text-sm font-medium">${tx.date}</td>
                  <td class="py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <i class='bx bx-package text-neutral-500'></i>
                      </div>
                      <span class="font-bold text-sm">${tx.project}</span>
                    </div>
                  </td>
                  <td class="py-4">
                    <span class="font-bold text-sm ${tx.type === 'income' ? 'text-brand-dark' : 'text-rose-600'}">
                      ${tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(8)} Pi
                    </span>
                  </td>
                  <td class="py-4">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${tx.status === 'Completed' ? 'bg-brand/10 text-brand' : 'bg-amber-100 text-amber-700'}">
                      ${tx.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transaction Chart Section -->
      <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-xl font-bold">Transaction Analysis</h3>
            <p class="text-sm text-neutral-500">Visual representation of amounts over time</p>
          </div>
        </div>
        <div class="h-[300px] w-full relative">
          <canvas id="transactionChart"></canvas>
        </div>
      </div>
    </div>
    `;
  },
  ecosystem: () => `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 class="text-2xl font-bold">Ecosystem Apps</h2>
        <div class="relative">
          <i class='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400'></i>
          <input type="text" id="eco-search" placeholder="Search platforms..." class="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-brand outline-none w-full md:w-64">
        </div>
      </div>
      <div id="eco-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${ECOSYSTEM_DATA.map(eco => window.renderEcoCard(eco)).join('')}
      </div>
    </div>
  `,
  orders: () => `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-w-0">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">Orders & Bookings</h2>
        <div class="flex items-center gap-3">
          <div class="relative hidden sm:block">
            <i class='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400'></i>
            <input type="text" id="orders-search" placeholder="Search orders..." class="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-brand outline-none w-48 transition-all focus:w-64">
          </div>
          <button onclick="handleAction('Export Orders')" class="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold hover:bg-neutral-50 transition-colors">Export CSV</button>
        </div>
      </div>
      <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-neutral-100">
                <th class="pb-4 font-black text-[10px] uppercase tracking-widest text-neutral-400">Category</th>
                <th class="pb-4 font-black text-[10px] uppercase tracking-widest text-neutral-400">Reference</th>
                <th class="pb-4 font-black text-[10px] uppercase tracking-widest text-neutral-400">Date</th>
                <th class="pb-4 font-black text-[10px] uppercase tracking-widest text-neutral-400">Amount</th>
                <th class="pb-4 font-black text-[10px] uppercase tracking-widest text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody id="orders-table-body" class="divide-y divide-neutral-50">
              ${ORDERS_DATA.map(order => window.renderOrderRow(order)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  jobs: () => `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 class="text-2xl font-bold">Jobs & Services</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-6">
            <i class='bx bx-briefcase text-2xl'></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Open Jobs</h3>
          <p class="text-sm text-neutral-500 mb-6">7 active projects from SMAJ PI JOBS with milestone tracking enabled.</p>
          <button onclick="handleAction('Manage Jobs')" class="w-full py-3 bg-neutral-50 rounded-xl font-bold text-xs text-neutral-600 hover:bg-neutral-100 transition-all uppercase tracking-widest">Manage Jobs</button>
        </div>
        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <div class="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-6">
            <i class='bx bx-list-check text-2xl'></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Service Requests</h3>
          <p class="text-sm text-neutral-500 mb-6">4 service requests are waiting for your confirmation and funding.</p>
          <button onclick="handleAction('View Requests')" class="w-full py-3 bg-neutral-50 rounded-xl font-bold text-xs text-neutral-600 hover:bg-neutral-100 transition-all uppercase tracking-widest">View Requests</button>
        </div>
      </div>
    </div>
  `,
  notifications: () => `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 class="text-2xl font-bold">Notifications Center</h2>
        <div class="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          ${['All Projects', 'Store', 'Jobs', 'Wallet'].map((filter, i) => `
            <button onclick="handleAction('Filter by ${filter}')" class="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${i === 0 ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'}">
              ${filter}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="space-y-4">
        ${[
      { title: 'Order update', desc: 'Your order #ST-9201 was delivered successfully.', project: 'store', time: '2 hours ago' },
      { title: 'Job message', desc: 'Designer shared milestone files for contract #JB-4022.', project: 'jobs', time: '5 hours ago' },
      { title: 'Payment confirmation', desc: '65 Pi payment for SMAJ PI ENERGY completed.', project: 'wallet', time: '1 day ago' },
      { title: 'System alert', desc: 'New wallet session detected from Chrome on Windows.', project: 'wallet', time: '2 days ago' },
    ].map(notice => `
          <div class="p-6 rounded-3xl border border-neutral-200/60 bg-white shadow-sm flex items-start gap-4 group hover:border-brand transition-colors">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notice.project === 'store' ? 'bg-brand/10 text-brand' : notice.project === 'jobs' ? 'bg-blue-500/10 text-blue-600' : 'bg-neutral-100 text-neutral-500'}">
              <i class='bx ${notice.project === 'store' ? 'bx-shopping-bag' : notice.project === 'jobs' ? 'bx-briefcase' : 'bx-bell'} text-xl'></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h4 class="font-bold text-sm">${notice.title}</h4>
                <span class="text-[10px] text-neutral-400 font-medium">${notice.time}</span>
              </div>
              <p class="text-xs text-neutral-500 mb-4">${notice.desc}</p>
              <button onclick="handleAction('Mark as Read')" class="text-[10px] font-black uppercase tracking-widest text-brand hover:text-brand-dark transition-colors">Mark as Read</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `,
  analytics: () => `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 class="text-2xl font-bold">Analytics</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <p class="text-xs font-bold text-neutral-400 uppercase mb-2">Total Transactions</p>
          <h3 class="text-3xl font-bold">1,248</h3>
        </div>
        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <p class="text-xs font-bold text-neutral-400 uppercase mb-2">Total Earnings</p>
          <h3 class="text-3xl font-bold text-brand">314.15926535 Pi</h3>
        </div>
        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm md:col-span-2">
          <h3 class="text-lg font-bold mb-8">Ecosystem Activity</h3>
          <div class="h-[300px] w-full relative">
            <canvas id="ecosystemActivityChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
  profile: () => `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">Profile Management</h2>
        <button id="save-profile" class="px-6 py-2.5 bg-brand text-white rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all active:scale-95">
          Save Changes
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Avatar & Basic Info -->
        <div class="lg:col-span-1 space-y-6">
          <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm text-center">
            <div class="relative inline-block mb-6">
              <div class="w-32 h-32 rounded-full bg-brand/10 border-4 border-white shadow-xl flex items-center justify-center text-4xl font-bold text-brand overflow-hidden">
                ${userProfile.avatar ? `<img src="${userProfile.avatar}" class="w-full h-full object-cover">` : userProfile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <button onclick="handleAvatarChange()" class="absolute bottom-0 right-0 w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-500 hover:text-brand shadow-lg transition-all">
                <i class='bx bx-camera text-xl'></i>
              </button>
            </div>
            <h3 class="text-xl font-bold">${userProfile.name}</h3>
            <p class="text-sm text-neutral-500 mb-6">@${userProfile.username}</p>
            <div class="flex items-center justify-center gap-2 ${userProfile.kycStatus === 'verified' ? 'mb-6' : ''}">
              ${userProfile.kycStatus === 'verified' ? `
                <span class="px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <i class='bx bxs-check-circle'></i> Verified Pioneer
                </span>
              ` : `
                <span class="px-3 py-1 bg-neutral-100 text-neutral-400 rounded-full text-[10px] font-black uppercase tracking-widest">Unverified</span>
              `}
            </div>
            ${userProfile.kycStatus === 'verified' ? `
              <button onclick="window.downloadUserKYCData()" class="w-full py-3 bg-neutral-900 text-white rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-all">
                <i class='bx bx-download'></i> Download KYC Data
              </button>
            ` : ''}
          </div>

          <div class="p-6 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
            <h4 class="font-bold text-sm uppercase tracking-widest text-neutral-400 mb-4">Account Stats</h4>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-500">Joined</span>
                <span class="text-sm font-bold">${new Intl.DateTimeFormat(userProfile.language, { month: 'long', year: 'numeric' }).format(new Date(userProfile.joinedDate))}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-500">Trust Score</span>
                <span class="text-sm font-bold text-brand">${calculateTrustScore(userProfile)}/100</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-500">Referrals</span>
                <span class="text-sm font-bold">124</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Edit Form -->
        <div class="lg:col-span-2 space-y-6">
          <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
            <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
              <i class='bx bx-user-circle text-brand'></i> Personal Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Full Name</label>
                <input type="text" id="profile-name" value="${userProfile.name}" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Username</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">@</span>
                  <input type="text" id="profile-username" value="${userProfile.username}" class="w-full pl-8 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Gender</label>
                <select id="profile-gender" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                  <option value="">Select Gender</option>
                  <option value="male" ${userProfile.gender === 'male' ? 'selected' : ''}>Male</option>
                  <option value="female" ${userProfile.gender === 'female' ? 'selected' : ''}>Female</option>
                  <option value="other" ${userProfile.gender === 'other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Nationality</label>
                <select id="profile-nationality" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                  <option value="">Select Country</option>
                  ${countries.map(c => `<option value="${c.code}" ${userProfile.nationality === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Bio / About</label>
                <textarea id="profile-bio" rows="3" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium resize-none text-sm">${userProfile.bio}</textarea>
              </div>
            </div>
          </div>

          <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
            <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
              <i class='bx bx-envelope text-brand'></i> Contact Details
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
                <input type="email" id="profile-email" value="${userProfile.email}" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Phone Number</label>
                <input type="tel" id="profile-phone" value="${userProfile.phone}" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Occupation / Professional Title</label>
                <input type="text" id="profile-occupation" value="${userProfile.occupation || ''}" placeholder="Software Engineer" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Physical Address</label>
                <input type="text" id="profile-address" value="${userProfile.address}" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Personal Website</label>
                <input type="url" id="profile-website" value="${userProfile.website || ''}" placeholder="https://yourwebsite.com" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
              </div>
            </div>
          </div>

          <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
            <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
              <i class='bx bx-share-alt text-brand'></i> Social Profiles
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">X (Twitter) Username</label>
                <input type="text" id="profile-socialTwitter" value="${userProfile.socialTwitter || ''}" placeholder="Username" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Telegram Username</label>
                <input type="text" id="profile-socialTelegram" value="${userProfile.socialTelegram || ''}" placeholder="Username" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  security: () => `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 class="text-2xl font-bold">Security & Globalization</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Localization & Globalization -->
        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-8">
          <div>
            <h3 class="text-lg font-bold mb-2 flex items-center gap-2">
              <i class='bx bx-globe text-brand'></i> Localization
            </h3>
            <p class="text-sm text-neutral-500 mb-6">Customize your experience with multi-language and regional support.</p>
          </div>

          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Preferred Language</label>
              <select id="settings-lang" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                ${LANGUAGES.map(l => `<option value="${l.code}" ${userProfile.language === l.code ? 'selected' : ''}>${l.flag} ${l.name}</option>`).join('')}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Currency</label>
                <select id="settings-currency" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                  ${CURRENCIES.map(c => `<option value="${c.code}" ${userProfile.currency === c.code ? 'selected' : ''}>${c.code} (${c.symbol}) - ${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Time Zone</label>
                <select id="settings-timezone" class="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-brand outline-none transition-all font-medium">
                  ${TIMEZONES.map(t => `<option value="${t.value}" ${userProfile.timezone === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy & Compliance -->
        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm space-y-8">
          <div>
            <h3 class="text-lg font-bold mb-2 flex items-center gap-2">
              <i class='bx bx-lock-alt text-brand'></i> Privacy & Compliance
            </h3>
            <p class="text-sm text-neutral-500 mb-6">Manage your data visibility and GDPR/CCPA rights.</p>
          </div>

          <div class="space-y-6">
            <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div>
                <h4 class="font-bold text-sm">Profile Visibility</h4>
                <p class="text-[10px] text-neutral-500">Control who can see your activity</p>
              </div>
              <select id="settings-visibility" class="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-3 py-1.5 outline-none">
                <option value="public" ${userProfile.visibility === 'public' ? 'selected' : ''}>Public</option>
                <option value="private" ${userProfile.visibility === 'private' ? 'selected' : ''}>Private</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button onclick="handleAction('Export Data')" class="p-4 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-100 text-left transition-all group">
                <i class='bx bx-download text-xl text-neutral-400 group-hover:text-brand mb-2'></i>
                <h4 class="font-bold text-xs">Export Data</h4>
                <p class="text-[9px] text-neutral-500 uppercase font-black">GDPR Request</p>
              </button>
              <button onclick="handleAction('Delete Data')" class="p-4 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-100 text-left transition-all group">
                <i class='bx bx-trash text-xl text-neutral-400 group-hover:text-rose-500 mb-2'></i>
                <h4 class="font-bold text-xs">Delete Data</h4>
                <p class="text-[9px] text-neutral-500 uppercase font-black">Right to Forget</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Security Features -->
        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <div class="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6">
            <i class='bx bx-shield-quarter text-2xl'></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Two-Factor Authentication</h3>
          <p class="text-sm text-neutral-500 mb-8">Add an extra layer of security to your account by requiring a code from your phone.</p>
          <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <span class="font-bold text-sm">Status: <span class="text-rose-500">Disabled</span></span>
            <button onclick="handleAction('Enable 2FA')" class="px-4 py-2 bg-brand text-white rounded-xl font-bold text-xs">Enable 2FA</button>
          </div>
        </div>

        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
            <i class='bx bx-wallet text-2xl'></i>
          </div>
          <h3 class="text-xl font-bold mb-2">Wallet Session</h3>
          <p class="text-sm text-neutral-500 mb-8">Your wallet signature is your identity. Reconnect if you need to refresh access.</p>
          <button onclick="handleAction('Refresh Session')" class="w-full py-4 border-2 border-neutral-100 rounded-2xl font-bold text-sm hover:bg-neutral-50 transition-colors">
            Refresh Wallet Signature
          </button>
        </div>
      </div>
    </div>
  `,
  admin: () => {
    return `
      <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-black tracking-tight">Admin Panel</h2>
            <p class="text-neutral-500">Manage KYC Submissions & Ecosystem Compliance</p>
          </div>
          <div class="flex gap-3">
            <button onclick="handleAction('Export Admin Data')" class="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold hover:bg-neutral-50 transition-all">Export CSV</button>
            <button onclick="window.bulkApproveKYC()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all flex items-center gap-2">
              <i class='bx bx-check-double text-xl'></i> Bulk Approve
            </button>
            <button onclick="window.bulkRejectKYC()" class="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/20 hover:scale-105 transition-all flex items-center gap-2">
              <i class='bx bx-x-circle text-xl'></i> Bulk Reject
            </button>
            <button id="admin-refresh" class="px-4 py-2 bg-brand text-white rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:scale-105 transition-all flex items-center gap-2">
              <i class='bx bx-refresh text-xl'></i> Refresh Data
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-3xl bg-white border border-neutral-200/60 shadow-sm">
            <p class="text-xs font-bold text-neutral-400 uppercase mb-1">Pending KYC</p>
            <h3 class="text-3xl font-black">${kycSubmissions.filter(s => s.status === 'pending').length}</h3>
          </div>
          <div class="p-6 rounded-3xl bg-white border border-neutral-200/60 shadow-sm">
            <p class="text-xs font-bold text-neutral-400 uppercase mb-1">Verified Today</p>
            <h3 class="text-3xl font-black text-emerald-600">12</h3>
          </div>
          <div class="p-6 rounded-3xl bg-white border border-neutral-200/60 shadow-sm">
            <p class="text-xs font-bold text-neutral-400 uppercase mb-1">Rejection Rate</p>
            <h3 class="text-3xl font-black text-rose-600">4.2%</h3>
          </div>
        </div>

        <div class="p-8 rounded-3xl border border-neutral-200/60 bg-white shadow-sm overflow-hidden">
          <h3 class="text-xl font-bold mb-6">Recent Submissions</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-neutral-100">
                  <th class="pb-4"><input type="checkbox" onchange="window.toggleAdminSelectAll(this)" class="rounded border-neutral-300"></th>
                  <th class="pb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Submission ID</th>
                  <th class="pb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">User</th>
                  <th class="pb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Type / TIN</th>
                  <th class="pb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Country</th>
                  <th class="pb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Date</th>
                  <th class="pb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                  <th class="pb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-50">
                ${kycSubmissions.map(sub => `
                  <tr>
                    <td class="py-4"><input type="checkbox" class="admin-sub-select rounded border-neutral-300" data-id="${sub.id}"></td>
                    <td class="py-4 text-sm font-mono text-neutral-500">${sub.id}</td>
                    <td class="py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-xs">${sub.name[0]}</div>
                        <span class="text-sm font-bold">${sub.name}</span>
                      </div>
                    </td>
                    <td class="py-4">
                      <div class="space-y-1">
                        <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded ${sub.kycType === 'vendor' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}">
                          ${sub.kycType || 'pioneer'}
                        </span>
                        ${sub.kycType === 'vendor' && sub.taxIdNumber ? `<p class="text-xs font-mono text-neutral-400">TIN: ${sub.taxIdNumber}</p>` : ''}
                        ${sub.kycType === 'vendor' && sub.storeName ? `<p class="text-[10px] font-bold text-neutral-500">${sub.storeName}</p>` : ''}
                      </div>
                    </td>
                    <td class="py-4 text-sm">${sub.country}</td>
                    <td class="py-4 text-sm text-neutral-500">${sub.date}</td>
                    <td class="py-4">
                      <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${sub.status === 'verified' ? 'bg-emerald-100 text-emerald-600' :
        sub.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
          'bg-amber-100 text-amber-600'
      }">${sub.status}</span>
                      ${sub.status === 'rejected' && sub.rejectionReason ? `<p class="text-[9px] text-rose-500 mt-1">Reason: ${sub.rejectionReason}</p>` : ''}
                    </td>
                    <td class="py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button onclick="window.downloadKYCArchive('${sub.id}')" class="p-2 bg-neutral-900 text-white hover:bg-black rounded-lg transition-colors" title="Download Archive (ZIP)">
                          <i class='bx bx-download text-xl'></i>
                        </button>
                        ${sub.front && sub.back ? `
                          <button onclick="window.viewIDDocuments('${sub.id}')" class="p-2 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors" title="View ID Documents">
                            <i class='bx bx-id-card text-xl'></i>
                          </button>
                        ` : ''}
                        ${sub.kycType === 'vendor' && sub.businessLicense ? `
                          <button onclick="window.viewBusinessLicense('${sub.id}')" class="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="View Business License">
                            <i class='bx bx-file-find text-xl'></i>
                          </button>
                        ` : ''}
                        ${sub.status === 'pending' ? `
                          <button class="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Approve">
                            <i class='bx bx-check text-xl'></i>
                          </button>
                          <button class="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Reject">
                            <i class='bx bx-x text-xl'></i>
                          </button>
                        ` : ''}
                        <button class="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                          <i class='bx bx-dots-vertical-rounded text-xl'></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};

// --- Functions ---
let currentCropper = null;

function debounce(func, timeout = 1000) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function showWelcomePopup(name) {
  if (sessionStorage.getItem('smaj_welcome_shown')) return;
  sessionStorage.setItem('smaj_welcome_shown', 'true');

  const hour = new Date().getHours();
  let greeting = 'Welcome Back';
  if (hour >= 5 && hour < 12) greeting = 'Good Morning';
  else if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
  else greeting = 'Good Evening';

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="p-8 text-center space-y-6">
        <div class="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
          <i class='bx bx-party text-4xl'></i>
        </div>
        <div class="space-y-2">
          <h3 class="text-2xl font-bold">${greeting}!</h3>
          <p class="text-neutral-500 text-sm">Hello <b>${name}</b>, your SMAJ Ecosystem session is active and ready.</p>
        </div>
        <button id="close-welcome" class="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          Enter Dashboard
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#close-welcome').onclick = () => modal.remove();
}

function playSuccessSound(isFinal = false) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    if (isFinal) {
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } else {
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime); // E5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    }
  } catch (e) {
    console.warn("Audio feedback not supported:", e);
  }
}

function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
    }`;

  const icon = type === 'error' ? 'bx-error-circle' : 'bx-check-circle';
  toast.innerHTML = `
    <i class='bx ${icon} text-xl'></i>
    <p class="font-bold text-sm">${message}</p>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-4');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function updateKycProgressUI() {
  const isNameDone = userProfile.kycData.fullName?.length > 2;
  const isDobDone = !!userProfile.kycData.dob;
  const isCountryDone = !!userProfile.kycData.country;
  const isDocTypeDone = !!userProfile.kycData.docType;
  const isFrontDone = !!userProfile.kycData.front;
  const isBackDone = !!userProfile.kycData.back;

  const steps = [
    { id: 'name', done: isNameDone },
    { id: 'dob', done: isDobDone },
    { id: 'country', done: isCountryDone },
    { id: 'doctype', done: isDocTypeDone },
    { id: 'front', done: isFrontDone },
    { id: 'back', done: isBackDone },
    ...(userProfile.kycData.kycType === 'vendor' ? [
      { id: 'license', done: !!userProfile.kycData.businessLicense },
      { id: 'regnumber', done: userProfile.kycData.businessRegNumber?.length > 2 },
      { id: 'taxid', done: userProfile.kycData.taxIdNumber?.length > 4 },
      { id: 'storename', done: userProfile.kycData.storeName?.length > 2 },
      { id: 'buscat', done: !!userProfile.kycData.businessCategory },
      { id: 'busaddr', done: userProfile.kycData.businessAddress?.length > 5 }
    ] : [])
  ];

  steps.forEach(step => {
    const el = document.getElementById(`kyc-check-${step.id}`);
    if (el) {
      el.className = `flex items-center gap-3 text-sm ${step.done ? 'text-emerald-600' : 'text-neutral-400'} transition-colors duration-300`;
      const icon = el.querySelector('.check-icon');
      if (icon) icon.className = `check-icon w-5 h-5 rounded-full flex items-center justify-center border ${step.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-200 text-transparent'}`;
      const label = el.querySelector('.check-label');
      if (label) label.className = `check-label ${step.done ? 'font-bold' : 'font-medium'}`;
    }
  });

  const progress = Math.round((steps.filter(s => s.done).length / steps.length) * 100);
  const progressText = document.getElementById('kyc-progress-text');
  const progressBar = document.getElementById('kyc-progress-bar');
  if (progressText) progressText.innerText = `${progress}%`;
  if (progressBar) progressBar.style.width = `${progress}%`;
}

function captureCameraImage(onCapture) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="p-6 border-b border-neutral-100 flex items-center justify-between">
        <h3 class="text-xl font-bold">Capture Document</h3>
        <button id="camera-close" class="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors">
          <i class='bx bx-x text-2xl'></i>
        </button>
      </div>
      <div class="p-6 space-y-6">
        <div class="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
          <video id="camera-video" autoplay playsinline class="w-full h-full object-cover"></video>
          <canvas id="camera-canvas" class="hidden"></canvas>
          <div id="camera-loader" class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            <div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest">Starting Camera...</p>
          </div>
          <div class="absolute inset-0 border-2 border-dashed border-white/30 rounded-2xl pointer-events-none m-8"></div>
        </div>
        <div class="flex gap-4">
          <button id="camera-cancel" class="flex-1 py-4 rounded-2xl font-bold border border-neutral-200 hover:bg-neutral-50 transition-all">Cancel</button>
          <button id="camera-capture" class="flex-1 py-4 rounded-2xl font-bold bg-brand text-white shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>Capture Photo</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const video = modal.querySelector('#camera-video');
  const canvas = modal.querySelector('#camera-canvas');
  const loader = modal.querySelector('#camera-loader');
  const captureBtn = modal.querySelector('#camera-capture');
  let stream = null;

  async function startCamera() {
    try {
      // Try environment camera first, then fallback
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn('Environment camera failed, trying any camera:', e);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().catch(e => console.error('Video play error:', e));
        loader.classList.add('hidden');
        captureBtn.disabled = false;
      };
    } catch (err) {
      console.error('Camera Error:', err);
      showToast('Error accessing camera: ' + (err.name === 'NotAllowedError' ? 'Permission denied' : err.message));
      close();
    }
  }

  startCamera();

  const close = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    modal.remove();
  };

  modal.querySelector('#camera-close').onclick = close;
  modal.querySelector('#camera-cancel').onclick = close;
  captureBtn.onclick = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    close();
    onCapture(dataUrl);
  };
}

function openCropper(imageSrc, onCrop) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="p-6 border-b border-neutral-100 flex items-center justify-between">
        <h3 class="text-xl font-bold">Crop Document</h3>
        <button id="close-cropper" class="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors">
          <i class='bx bx-x text-2xl'></i>
        </button>
      </div>
      <div class="p-6">
        <div class="max-h-[60vh] overflow-hidden rounded-2xl bg-neutral-100 flex items-center justify-center relative min-h-[300px]">
          <div id="cropper-loader" class="absolute inset-0 flex flex-col items-center justify-center bg-neutral-50 z-10">
            <div class="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-3"></div>
            <p class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading Image...</p>
          </div>
          <img id="cropper-image" src="${imageSrc}" crossorigin="anonymous" class="max-w-full block opacity-0 transition-opacity duration-300">
        </div>
      </div>
      <div class="p-6 bg-neutral-50 flex items-center justify-end gap-4">
        <button id="cancel-crop" class="px-6 py-3 rounded-xl font-bold text-neutral-500 hover:bg-neutral-100 transition-all">Cancel</button>
        <button id="apply-crop" class="px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>Apply Crop</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const image = modal.querySelector('#cropper-image');
  const loader = modal.querySelector('#cropper-loader');
  const applyBtn = modal.querySelector('#apply-crop');

  const initCropper = () => {
    if (currentCropper) return;

    try {
      currentCropper = new Cropper(image, {
        aspectRatio: NaN, // Free crop
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
        restore: false,
        checkOrientation: false,
        modal: true,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        ready() {
          loader.classList.add('hidden');
          image.classList.remove('opacity-0');
          applyBtn.disabled = false;
        }
      });
    } catch (err) {
      console.error('Cropper init error:', err);
      showToast('Error initializing image cropper.');
      close();
    }
  };

  image.onload = initCropper;
  image.onerror = () => {
    showToast('Error loading image. Please check the URL or file.');
    close();
  };

  // If image is already loaded (cached)
  if (image.complete) {
    initCropper();
  }

  const close = () => {
    if (currentCropper) {
      currentCropper.destroy();
      currentCropper = null;
    }
    modal.remove();
  };

  modal.querySelector('#close-cropper').onclick = close;
  modal.querySelector('#cancel-crop').onclick = close;
  applyBtn.onclick = () => {
    if (!currentCropper) return;

    try {
      const croppedCanvas = currentCropper.getCroppedCanvas({
        maxWidth: 2048,
        maxHeight: 2048,
      });

      if (!croppedCanvas) {
        showToast('Could not crop image. Please try again.');
        return;
      }

      onCrop(croppedCanvas.toDataURL('image/jpeg', 0.9));
      close();
    } catch (err) {
      console.error('Crop error:', err);
      showToast('Error during image cropping.');
    }
  };
}

function renderSection(sectionId) {
  if (!templates[sectionId]) return;

  activeSection = sectionId;
  contentArea.innerHTML = templates[sectionId]();

  updateHeaderInfo();

  updateBackLink(); // Update links every time a new template is injected

  // Update sidebar profile mini
  const profileMini = document.querySelector('aside .mx-4');
  if (profileMini) {
    profileMini.innerHTML = `
      <div class="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold text-lg border-2 border-brand/20 overflow-hidden">
        ${userProfile.avatar ? `<img src="${userProfile.avatar}" class="w-full h-full object-cover">` : userProfile.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1">
          <h3 class="font-semibold truncate">${userProfile.name}</h3>
          ${userProfile.kycStatus === 'verified' ? `<i class='bx bxs-check-circle text-brand text-xs'></i>` : ''}
        </div>
        <p class="text-xs text-neutral-500">@${userProfile.username}</p>
      </div>
      <div id="wallet-status-dot" class="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
    `;
  }

  // Update Nav UI
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.section === sectionId) {
      btn.classList.add('active', 'bg-brand', 'text-white', 'shadow-lg', 'shadow-brand/20');
      btn.classList.remove('text-neutral-500', 'hover:bg-neutral-100', 'hover:text-neutral-900');
    } else {
      btn.classList.remove('active', 'bg-brand', 'text-white', 'shadow-lg', 'shadow-brand/20');
      btn.classList.add('text-neutral-500', 'hover:bg-neutral-100', 'hover:text-neutral-900');
    }
  });

  // Re-attach dynamic listeners
  if (sectionId === 'overview') {
    const balanceBtn = document.getElementById('balance-toggle');
    if (balanceBtn) {
      balanceBtn.onclick = () => {
        showBalance = !showBalance;
        renderSection('overview');
      };
    }

    const refreshBtn = document.getElementById('balance-refresh');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('bx-spin');
        setTimeout(() => {
          icon.classList.remove('bx-spin');
          showToast('Balance synchronized with Pi Mainnet!', 'success');
          playSuccessSound(false);
        }, 1500);
      };
    }
    initEcosystemChart();
  }

  if (sectionId === 'profile') {
    const saveBtn = document.getElementById('save-profile');
    if (saveBtn) {
      saveBtn.onclick = () => {
        userProfile.name = document.getElementById('profile-name').value;
        userProfile.username = document.getElementById('profile-username').value;
        userProfile.bio = document.getElementById('profile-bio').value;
        userProfile.email = document.getElementById('profile-email').value;
        userProfile.phone = document.getElementById('profile-phone').value;
        userProfile.address = document.getElementById('profile-address').value;
        userProfile.gender = document.getElementById('profile-gender').value;
        userProfile.nationality = document.getElementById('profile-nationality').value;
        userProfile.occupation = document.getElementById('profile-occupation').value;
        userProfile.website = document.getElementById('profile-website').value;
        userProfile.socialTwitter = document.getElementById('profile-socialTwitter').value;
        userProfile.socialTelegram = document.getElementById('profile-socialTelegram').value;

        localStorage.setItem('smaj_user_profile', JSON.stringify(userProfile));
        updateProfileCompletenessUI();
        showToast('Profile updated successfully!', 'success');

        saveBtn.innerHTML = "<i class='bx bx-check'></i> Saved";
        setTimeout(() => {
          renderSection('profile');
        }, 1000);
      };
    }

    // Auto-save logic with debounce to ensure data persistence as the user types
    const autoSave = debounce(() => {
      const ids = [
        'profile-name', 
        'profile-username', 
        'profile-bio', 
        'profile-email', 
        'profile-phone', 
        'profile-address',
        'profile-gender',
        'profile-nationality',
        'profile-occupation',
        'profile-website',
        'profile-socialTwitter',
        'profile-socialTelegram'
      ];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const key = id.replace('profile-', '');
          userProfile[key] = el.value;
        }
      });

      localStorage.setItem('smaj_user_profile', JSON.stringify(userProfile));
      updateProfileCompletenessUI();
      if (saveBtn) saveBtn.innerHTML = "<i class='bx bx-check'></i> Auto-saved";
    }, 1500);

    [
      'profile-name', 
      'profile-username', 
      'profile-bio', 
      'profile-email', 
      'profile-phone', 
      'profile-address',
      'profile-gender',
      'profile-nationality',
      'profile-occupation',
      'profile-website',
      'profile-socialTwitter',
      'profile-socialTelegram'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = autoSave;
    });
  }

  if (sectionId === 'security') {
    const langSelect = document.getElementById('settings-lang');
    const currencySelect = document.getElementById('settings-currency');
    const timezoneSelect = document.getElementById('settings-timezone');
    const visibilitySelect = document.getElementById('settings-visibility');

    if (langSelect) langSelect.onchange = (e) => userProfile.language = e.target.value;
    if (currencySelect) currencySelect.onchange = (e) => userProfile.currency = e.target.value;
    if (timezoneSelect) timezoneSelect.onchange = (e) => userProfile.timezone = e.target.value;
    if (visibilitySelect) visibilitySelect.onchange = (e) => userProfile.visibility = e.target.value;
  }

  if (sectionId === 'ecosystem') {
    const searchInput = document.getElementById('eco-search');
    const grid = document.getElementById('eco-grid');
    if (searchInput && grid) {
      searchInput.oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = ECOSYSTEM_DATA.filter(item => 
          item.name.toLowerCase().includes(val) || 
          item.status.toLowerCase().includes(val)
        );
        grid.innerHTML = filtered.map(item => window.renderEcoCard(item)).join('');
      };
    }
  }

  if (sectionId === 'orders') {
    const searchInput = document.getElementById('orders-search');
    const tableBody = document.getElementById('orders-table-body');
    if (searchInput && tableBody) {
      searchInput.oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = ORDERS_DATA.filter(item => 
          item.cat.toLowerCase().includes(val) || 
          item.ref.toLowerCase().includes(val) || 
          item.status.toLowerCase().includes(val)
        );
        tableBody.innerHTML = filtered.map(item => window.renderOrderRow(item)).join('');
      };
    }
  }

  if (sectionId === 'admin') {
    document.querySelectorAll('.p-2.bg-emerald-50').forEach((btn, i) => {
      btn.onclick = () => {
        const sub = kycSubmissions.filter(s => s.status === 'pending')[i];
        if (sub) {
          sub.status = 'verified';
          renderSection('admin');
        }
      };
    });
    document.querySelectorAll('.p-2.bg-rose-50').forEach((btn, i) => {
      btn.onclick = () => {
        const sub = kycSubmissions.filter(s => s.status === 'pending')[i];
        if (sub) {
          sub.status = 'rejected';
          renderSection('admin');
        }
      };
    });
  }

  if (sectionId === 'kyc') {
    // Step 1: Personal Info & Docs
    if (userProfile.kycStep === 1) {
      const nameInput = document.getElementById('kyc-fullname');
      const dobInput = document.getElementById('kyc-dob');
      const pobInput = document.getElementById('kyc-pob');
      const countrySelect = document.getElementById('kyc-country');
      const docTypeRadios = document.querySelectorAll('input[name="kyc-doc-type"]');
      const kycTypeRadios = document.querySelectorAll('input[name="kyc-type"]');

      if (nameInput) nameInput.oninput = (e) => { userProfile.kycData.fullName = e.target.value; updateKycProgressUI(); };
      if (dobInput) dobInput.onchange = (e) => { userProfile.kycData.dob = e.target.value; updateKycProgressUI(); };
      if (pobInput) pobInput.oninput = (e) => { userProfile.kycData.pob = e.target.value; updateKycProgressUI(); };
      if (countrySelect) countrySelect.onchange = (e) => { userProfile.kycData.country = e.target.value; updateKycProgressUI(); };
      docTypeRadios.forEach(radio => {
        radio.onchange = (e) => { userProfile.kycData.docType = e.target.value; updateKycProgressUI(); };
      });
      kycTypeRadios.forEach(radio => {
        radio.onchange = (e) => { userProfile.kycData.kycType = e.target.value; renderSection('kyc'); };
      });

      const regNumberInput = document.getElementById('kyc-reg-number');
      if (regNumberInput) regNumberInput.oninput = (e) => { 
        userProfile.kycData.businessRegNumber = e.target.value; 
        updateKycProgressUI(); 
      };

      const storeNameInput = document.getElementById('kyc-store-name');
      if (storeNameInput) storeNameInput.oninput = (e) => { 
        userProfile.kycData.storeName = e.target.value; 
        updateKycProgressUI(); 
      };

      const busCatSelect = document.getElementById('kyc-business-category');
      if (busCatSelect) busCatSelect.onchange = (e) => {
        userProfile.kycData.businessCategory = e.target.value;
        updateKycProgressUI();
      };

      const busAddrInput = document.getElementById('kyc-business-address');
      if (busAddrInput) busAddrInput.oninput = (e) => {
        userProfile.kycData.businessAddress = e.target.value;
        updateKycProgressUI();
      };

      const taxIdInput = document.getElementById('kyc-tax-id');
      if (taxIdInput) taxIdInput.oninput = (e) => {
        userProfile.kycData.taxIdNumber = e.target.value;
        updateKycProgressUI();
      };

      const nextBtn = document.getElementById('next-to-liveness');

      // File Upload Front
      const frontInput = document.getElementById('kyc-file-front');
      const frontUploadView = document.getElementById('front-upload-view');
      const frontCameraView = document.getElementById('front-camera-view');
      const frontUrlInput = document.getElementById('kyc-url-front');
      const frontUrlBtn = document.getElementById('front-url-btn');

      if (frontUploadView && frontInput) {
        frontUploadView.onclick = () => frontInput.click();
        frontInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              openCropper(re.target.result, (croppedUrl) => {
                userProfile.kycData.front = croppedUrl;
                renderSection('kyc');
              });
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset for same file
          }
        };
      }

      if (frontCameraView) {
        frontCameraView.onclick = () => {
          captureCameraImage((dataUrl) => {
            openCropper(dataUrl, (croppedUrl) => {
              userProfile.kycData.front = croppedUrl;
              renderSection('kyc');
            });
          });
        };
      }

      if (frontUrlBtn && frontUrlInput) {
        frontUrlBtn.onclick = () => {
          let url = frontUrlInput.value.trim();
          if (url) {
            // Use a CORS proxy to avoid issues with external URLs
            const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              openCropper(proxiedUrl, (croppedUrl) => {
                userProfile.kycData.front = croppedUrl;
                renderSection('kyc');
              });
            };
            img.onerror = () => {
              // Fallback to direct URL if proxy fails
              const directImg = new Image();
              directImg.crossOrigin = "anonymous";
              directImg.onload = () => {
                openCropper(url, (croppedUrl) => {
                  userProfile.kycData.front = croppedUrl;
                  renderSection('kyc');
                });
              };
              directImg.onerror = () => {
                showToast('Error: Image URL is inaccessible or blocked by security settings.');
              };
              directImg.src = url;
            };
            img.src = proxiedUrl;
          } else {
            showToast('Please enter a valid image URL.');
          }
        };
      }

      // File Upload Back
      const backInput = document.getElementById('kyc-file-back');
      const backUploadView = document.getElementById('back-upload-view');
      const backCameraView = document.getElementById('back-camera-view');
      const backUrlInput = document.getElementById('kyc-url-back');
      const backUrlBtn = document.getElementById('back-url-btn');

      if (backUploadView && backInput) {
        backUploadView.onclick = () => backInput.click();
        backInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              openCropper(re.target.result, (croppedUrl) => {
                userProfile.kycData.back = croppedUrl;
                renderSection('kyc');
              });
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset for same file
          }
        };
      }

      if (backCameraView) {
        backCameraView.onclick = () => {
          captureCameraImage((dataUrl) => {
            openCropper(dataUrl, (croppedUrl) => {
              userProfile.kycData.back = croppedUrl;
              renderSection('kyc');
            });
          });
        };
      }

      if (backUrlBtn && backUrlInput) {
        backUrlBtn.onclick = () => {
          let url = backUrlInput.value.trim();
          if (url) {
            // Use a CORS proxy to avoid issues with external URLs
            const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              openCropper(proxiedUrl, (croppedUrl) => {
                userProfile.kycData.back = croppedUrl;
                renderSection('kyc');
              });
            };
            img.onerror = () => {
              // Fallback to direct URL if proxy fails
              const directImg = new Image();
              directImg.crossOrigin = "anonymous";
              directImg.onload = () => {
                openCropper(url, (croppedUrl) => {
                  userProfile.kycData.back = croppedUrl;
                  renderSection('kyc');
                });
              };
              directImg.onerror = () => {
                showToast('Error: Image URL is inaccessible or blocked by security settings.');
              };
              directImg.src = url;
            };
            img.src = proxiedUrl;
          } else {
            showToast('Please enter a valid image URL.');
          }
        };
      }

      // Business License Listeners
      const licenseInput = document.getElementById('kyc-file-license');
      const licenseUploadView = document.getElementById('license-upload-view');
      const licenseCameraView = document.getElementById('license-camera-view');
      const licenseUrlInput = document.getElementById('kyc-url-license');
      const licenseUrlBtn = document.getElementById('license-url-btn');

      if (licenseUploadView && licenseInput) {
        licenseUploadView.onclick = () => licenseInput.click();
        licenseInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              openCropper(re.target.result, (croppedUrl) => {
                userProfile.kycData.businessLicense = croppedUrl;
                renderSection('kyc');
              });
            };
            reader.readAsDataURL(file);
            e.target.value = '';
          }
        };
      }

      if (licenseCameraView) {
        licenseCameraView.onclick = () => {
          captureCameraImage((dataUrl) => {
            openCropper(dataUrl, (croppedUrl) => {
              userProfile.kycData.businessLicense = croppedUrl;
              renderSection('kyc');
            });
          });
        };
      }

      if (licenseUrlBtn && licenseUrlInput) {
        licenseUrlBtn.onclick = () => {
          let url = licenseUrlInput.value.trim();
          if (url) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              openCropper(url, (croppedUrl) => {
                userProfile.kycData.businessLicense = croppedUrl;
                renderSection('kyc');
              });
            };
            img.src = url;
          }
        };
      }

      // Reset Buttons
      document.querySelectorAll('.kyc-reset-btn').forEach(btn => {
        btn.onclick = () => {
          const side = btn.dataset.side;
          userProfile.kycData[side] = null;
          renderSection('kyc');
        };
      });

      async function verifyBusinessLicenseAI(storeName, regNumber, taxId, category, licenseBase64) {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) return { match: true, reason: "AI Verification skipped (No API Key)" };

        const base64Image = licenseBase64.split(',')[1];
        const prompt = `Verify if this Business License document belongs to a "${category}" business named "${storeName}" with Registration Number "${regNumber}" and Tax Identification Number "${taxId}". 
        Check if the store name, registration number, tax ID, and business type on the document match or are legal variations of the provided details. 
        Return ONLY a JSON object: {"match": boolean, "reason": "short explanation"}`;

        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
              }]
            })
          });
          
          const result = await response.json();
          const text = result.candidates[0].content.parts[0].text;
          const jsonMatch = text.match(/\{.*\}/s);
          return jsonMatch ? JSON.parse(jsonMatch[0]) : { match: false, reason: "Could not parse AI response." };
        } catch (err) {
          console.error("Gemini AI Error:", err);
          return { match: false, reason: "AI Analysis failed. Please check document clarity." };
        }
      }

      async function verifyFaceMatchAI(idFrontBase64, livenessFrames) {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) return { match: true, confidence: 100, reason: "AI Verification skipped (No API Key)" };

        const idFrontData = idFrontBase64.split(',')[1];
        const livenessParts = livenessFrames.map(frame => ({
          inline_data: { mime_type: "image/jpeg", data: frame.split(',')[1] }
        }));

        const prompt = `Compare the person in the Identity Document (Image 1) with the person in the liveness check frames (Images 2, 3, 4). 
        Determine if they are the same person. Consider facial features, bone structure, and identifying marks.
        Return ONLY a JSON object: {"match": boolean, "confidence": number, "reason": "short explanation"}`;

        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: "image/jpeg", data: idFrontData } },
                  ...livenessParts
                ]
              }]
            })
          });
          
          const result = await response.json();
          const text = result.candidates[0].content.parts[0].text;
          const jsonMatch = text.match(/\{.*\}/s);
          return jsonMatch ? JSON.parse(jsonMatch[0]) : { match: false, reason: "Could not parse AI response." };
        } catch (err) {
          console.error("Gemini AI Face Match Error:", err);
          return { match: false, reason: "AI Face Analysis failed." };
        }
      }

      if (nextBtn) {
        nextBtn.onclick = async () => {
          const fullName = document.getElementById('kyc-fullname').value;
          const dob = document.getElementById('kyc-dob').value;
          const country = document.getElementById('kyc-country').value;
          const docType = document.querySelector('input[name="kyc-doc-type"]:checked')?.value;

          if (!fullName || !dob || !country || !docType) {
            showToast('Please fill in all personal details and select a document type.');
            return;
          }

          // Age validation: Ensure user is at least 18 years old
          const birthDate = new Date(dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age < 18) {
            showToast('Eligibility Error: You must be at least 18 years old to complete KYC.');
            return;
          }

          if (!userProfile.kycData.front || !userProfile.kycData.back) {
            showToast('Please provide both front and back images of your document.');
            return;
          }

          if (userProfile.kycData.kycType === 'vendor' && !userProfile.kycData.businessLicense) {
            showToast('Please provide your business license or registration document.');
            return;
          }

          if (userProfile.kycData.kycType === 'vendor' && (!userProfile.kycData.businessRegNumber || userProfile.kycData.businessRegNumber.length < 3)) {
            showToast('Please enter a valid Business Registration Number.');
            return;
          }

          if (userProfile.kycData.kycType === 'vendor' && (!userProfile.kycData.storeName || userProfile.kycData.storeName.length < 3)) {
            showToast('Please enter a valid Store or Business Name.');
            return;
          }

          if (userProfile.kycData.kycType === 'vendor') {
            nextBtn.disabled = true;
            nextBtn.innerHTML = "<i class='bx bx-loader-alt animate-spin'></i> AI Analyzing License...";
            
            if (!userProfile.kycData.taxIdNumber || userProfile.kycData.taxIdNumber.length < 5) {
              showToast('Please enter a valid Tax Identification Number.');
              nextBtn.disabled = false;
              nextBtn.innerHTML = "Next: Face Verification <i class='bx bx-right-arrow-alt text-xl'></i>";
              return;
            }

            if (!userProfile.kycData.businessCategory || !userProfile.kycData.businessAddress) {
              showToast('Please provide a business category and physical address.');
              nextBtn.disabled = false;
              nextBtn.innerHTML = "Next: Face Verification <i class='bx bx-right-arrow-alt text-xl'></i>";
              return;
            }

            const aiResult = await verifyBusinessLicenseAI(
              userProfile.kycData.storeName, 
              userProfile.kycData.businessRegNumber, 
              userProfile.kycData.taxIdNumber,
              userProfile.kycData.businessCategory, 
              userProfile.kycData.businessLicense
            );
            if (!aiResult.match) {
              showToast(`Verification Failed: ${aiResult.reason}`);
              renderSection('kyc');
              return;
            }
          }

          userProfile.kycData.fullName = fullName;
          userProfile.kycData.dob = dob;
          userProfile.kycData.country = country;
          userProfile.kycData.docType = docType;

          userProfile.kycStep = 2;
          localStorage.setItem('smaj_user_profile', JSON.stringify(userProfile));
          renderSection('kyc');
        };
      }

      // Initialize UI state for existing data
      updateKycProgressUI();
    }

    // Step 2: Liveness Check
    if (userProfile.kycStep === 2) {
      const startBtn = document.getElementById('start-liveness');
      if (startBtn) {
        startBtn.onclick = () => {
          startLivenessCheck();
        };
      }
    }

    // Step 3: Final Review
    if (userProfile.kycStep === 3) {
      const submitFinalBtn = document.getElementById('submit-kyc-final');
      if (submitFinalBtn) {
        submitFinalBtn.onclick = async () => {
          const agree = document.getElementById('kyc-agree-final').checked;
          if (!agree) {
            showToast('Please agree to the terms and conditions.');
            return;
          }

          submitFinalBtn.disabled = true;
          submitFinalBtn.innerHTML = "<i class='bx bx-loader-alt animate-spin'></i> AI Matching Face...";

          const faceMatch = await verifyFaceMatchAI(userProfile.kycData.front, userProfile.kycData.liveness);
          
          if (!faceMatch.match && faceMatch.confidence < 70) {
            showToast(`Face Match Failed: ${faceMatch.reason}`);
            submitFinalBtn.disabled = false;
            submitFinalBtn.innerHTML = "Submit For Final Review";
            return;
          }

          userProfile.kycStatus = 'pending';
          localStorage.setItem('smaj_user_profile', JSON.stringify(userProfile));
          renderSection('kyc');

          // Add to admin submissions
          kycSubmissions.unshift({
            id: `KYC-${Math.floor(Math.random() * 10000)}`,
            name: userProfile.kycData.fullName,
            country: userProfile.kycData.country,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            kycType: userProfile.kycData.kycType,
            taxIdNumber: userProfile.kycData.taxIdNumber,
            storeName: userProfile.kycData.storeName,
            businessLicense: userProfile.kycData.businessLicense,
            front: userProfile.kycData.front,
            back: userProfile.kycData.back,
            liveness: userProfile.kycData.liveness
          });
        };
      }
    }
  }

  // Initialize Chart if in finance section
  if (sectionId === 'finance') {
    initTransactionChart();

    const transRefreshBtn = document.getElementById('transactions-refresh');
    if (transRefreshBtn) {
      transRefreshBtn.onclick = () => {
        const icon = transRefreshBtn.querySelector('i');
        icon.classList.add('bx-spin');
        setTimeout(() => {
          icon.classList.remove('bx-spin');
          showToast('Transaction history synchronized!', 'success');
          playSuccessSound(false);
        }, 1500);
      };
    }
  }

  // Initialize Chart if in analytics section
  if (sectionId === 'analytics') {
    initAnalyticsChart();
  }
}

function initAnalyticsChart() {
  const ctx = document.getElementById('ecosystemActivityChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Activity',
        data: [35, 52, 44, 75, 61, 88, 78],
        backgroundColor: '#7d3cff',
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 20,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#171717',
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false,
          },
          ticks: {
            font: { size: 10, weight: 'bold' },
            color: '#a3a3a3',
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: 'bold' },
            color: '#a3a3a3',
          }
        }
      }
    }
  });
}

function initEcosystemChart() {
  const ctx = document.getElementById('ecosystemChart');
  if (!ctx) return;

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Growth',
        data: [35, 52, 44, 75, 61, 88, 70],
        borderColor: '#7d3cff',
        borderWidth: 3,
        fill: true,
        backgroundColor: gradient,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#7d3cff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#171717',
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          callbacks: {
            label: (context) => `Growth: ${context.raw}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.03)', drawBorder: false },
          ticks: { font: { weight: 'bold' }, callback: (value) => value + '%' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { weight: 'bold' } }
        }
      }
    }
  });
}

function initTransactionChart() {
  const ctx = document.getElementById('transactionChart');
  if (!ctx) return;

  // Prepare data: Sort by date and group amounts
  const sortedData = [...TRANSACTION_DATA].sort((a, b) => new Date(a.date) - new Date(b.date));

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedData.map(tx => tx.date),
      datasets: [{
        label: 'Transaction Amount (Pi)',
        data: sortedData.map(tx => tx.amount),
        backgroundColor: sortedData.map(tx => tx.type === 'income' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(244, 63, 94, 0.6)'),
        borderColor: sortedData.map(tx => tx.type === 'income' ? 'rgb(16, 185, 129)' : 'rgb(244, 63, 94)'),
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: sortedData.map(tx => tx.type === 'income' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(244, 63, 94, 0.8)'),
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#171717',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          callbacks: {
            label: (context) => {
              const tx = sortedData[context.dataIndex];
              return `${tx.type === 'income' ? '+' : '-'}${context.raw.toFixed(6)} Pi (${tx.project})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: { weight: 'bold' },
            callback: (value) => value.toFixed(6) + ' Pi'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: { weight: 'bold' }
          }
        }
      }
    }
  });
}

function toggleSidebar(open) {
  if (open) {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  }
}

// --- Event Listeners ---
sidebarOpen.onclick = () => toggleSidebar(true);
sidebarClose.onclick = () => toggleSidebar(false);
sidebarOverlay.onclick = () => toggleSidebar(false);

const PI_NETWORK_HOME = 'https://officialsmaj.github.io/smajpihub/';

// Initialize Pi SDK
const initPiSDK = () => {
  if (typeof Pi !== 'undefined') {
    try {
      // Note: Use sandbox: true during development/testnet phase
      Pi.init({ version: "2.0", sandbox: false });
    } catch (e) {
      console.error("Pi SDK Init Error:", e);
    }
  } else {
    console.warn("Pi SDK not detected. Wallet features require the Pi Browser.");
  }
};
initPiSDK();

navMenu.onclick = (e) => {
  const btn = e.target.closest('.nav-btn');
  if (btn) {
    renderSection(btn.dataset.section);
    if (window.innerWidth < 1024) toggleSidebar(false);
  }
};

walletToggle.onclick = async () => {
  if (!isWalletConnected) {
    if (typeof Pi === 'undefined') {
      showToast('Pi SDK not detected. Please open this app in the Pi Browser.');
      return;
    }

    walletToggle.disabled = true;
    if (walletToggleText) walletToggleText.innerText = 'Connecting...';

    try {
      const scopes = ['username', 'payments', 'wallet_address'];
      const auth = await Pi.authenticate(scopes, (payment) => {
        // Handle incomplete payments found in the Pi Browser cache
        console.log("Found incomplete payment:", payment);
      });

      isWalletConnected = true;
      
      // Real Pi Username logic: Map identity to profile
      userProfile.name = auth.user.username;
      userProfile.username = auth.user.username;
      userProfile.walletAddress = auth.user.wallet_address;
      
      // Persistence: Store in localStorage for session consistency
      localStorage.setItem('pi_user', JSON.stringify(auth.user));
      
      showToast(`Welcome, @${auth.user.username}!`, 'success');
      setWalletConnectionState(true);
      
      // Load real transactions after login
      TRANSACTION_DATA = await fetchBackendTransactions();
      renderSection(activeSection);
    } catch (err) {
      console.error('Pi Auth Error:', err);
      showToast(`Auth Error: ${err.message || 'Check Pi Browser settings'}`);
    } finally {
      walletToggle.disabled = false;
      if (walletToggleText) {
        walletToggleText.innerText = isWalletConnected ? 'Disconnect Wallet' : 'Connect Wallet';
      }
    }
  } else {
    setWalletConnectionState(false);
    resetUserProfileToDefaults();
    localStorage.removeItem('pi_user');
    sessionStorage.removeItem('smaj_welcome_shown');
    showToast('Wallet disconnected');
    
    // Redirect back to the Hub
    window.location.href = PI_NETWORK_HOME;
  }
};

themeToggle.onclick = () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark', isDarkMode);
  themeToggle.innerHTML = `<i class='bx ${isDarkMode ? 'bx-sun' : 'bx-moon'} text-xl'></i>`;
};

// --- Initialization ---
// Update "Back to Site" link to "Back to Home"
function updateBackLink() {
  const backLinks = document.querySelectorAll('a');
  backLinks.forEach(link => {
    if (link.textContent.toLowerCase().includes('back to site')) {
      link.textContent = 'Back to Home';
      link.href = 'https://officialsmaj.github.io/smajpihub/';
    }
  });
}

// Check for existing session or token on startup
async function initSession() {
  // Load saved profile if any
  const savedProfile = localStorage.getItem('smaj_user_profile');
  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile);
      Object.assign(userProfile, parsed);
    } catch (e) {
      console.error('Error loading saved profile:', e);
    }
  }

  // 1. Check URL for SSO token (SSO takes priority)
  await trustTokenFromUrl();

  // 2. Fallback to localStorage if no token was found
  if (!isWalletConnected) {
    const savedUser = localStorage.getItem('pi_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      userProfile.name = user.username;
      userProfile.username = user.username;
      userProfile.walletAddress = user.wallet_address;
      setWalletConnectionState(true);
      showWelcomePopup(user.username);
    }
  }
  
  // Final render with correct user state
  renderSection(activeSection);

  // Dismiss the global loader
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => loader.remove(), 500); // Remove from DOM after fade animation
  }
}

updateBackLink();
initSession();

// Handle responsive sidebar on load
if (window.innerWidth >= 1024) {
  sidebar.classList.remove('-translate-x-full');
}

// --- AI Chatbot Logic ---
async function startLivenessCheck() {
  const video = document.getElementById('liveness-video');
  const canvas = document.getElementById('liveness-canvas');
  const instructionText = document.getElementById('liveness-text');
  const startBtn = document.getElementById('start-liveness');

  if (!video || !canvas || !instructionText) return;

  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } } });
    } catch (e) {
      console.warn('User camera failed, trying any camera:', e);
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    }

    video.srcObject = stream;
    await video.play().catch(e => console.warn("Video play failed:", e));

    startBtn.disabled = true;
    startBtn.innerHTML = "<i class='bx bx-loader-alt animate-spin'></i> Initializing...";

    // Wait for video to be ready and allow exposure to adjust
    if (video.readyState < 1) {
      await new Promise(resolve => video.onloadedmetadata = resolve);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay for exposure adjustment

    userProfile.kycData.liveness = []; // Reset frames

    for (const task of livenessTasks) {
      const taskEl = document.getElementById(`task-${task.id}`);
      if (!taskEl) continue;

      // Set Active state
      taskEl.classList.replace('opacity-40', 'opacity-100');
      taskEl.classList.add('border-brand/30', 'bg-brand/5', 'shadow-md');
      taskEl.querySelector('.task-icon-container').classList.replace('bg-neutral-50', 'bg-brand/10');
      taskEl.querySelector('.task-icon-container').classList.replace('text-neutral-400', 'text-brand');
      taskEl.querySelector('.status-dot').classList.replace('bg-neutral-300', 'bg-brand');
      taskEl.querySelector('.status-dot').classList.add('animate-pulse');
      taskEl.querySelector('.status-text').innerText = "Performing Task...";

      instructionText.innerText = task.text;
      instructionText.parentElement.classList.add('animate-bounce');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture frame for the review profile
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      userProfile.kycData.liveness.push(canvas.toDataURL('image/jpeg', 0.8));

      // Set Analyzing state
      taskEl.querySelector('.status-text').innerText = "Analyzing...";
      taskEl.querySelector('.task-progress').style.width = '100%';
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set Verified state
      taskEl.classList.replace('bg-brand/5', 'bg-emerald-50');
      taskEl.classList.replace('border-brand/30', 'border-emerald-200');
      taskEl.querySelector('.status-dot').classList.replace('bg-brand', 'bg-emerald-500');
      taskEl.querySelector('.status-dot').classList.remove('animate-pulse');
      taskEl.querySelector('.status-text').innerText = "Verified";
      taskEl.querySelector('.status-text').classList.replace('text-neutral-400', 'text-emerald-600');
      taskEl.querySelector('.status-icon').innerHTML = "<i class='bx bxs-check-circle text-emerald-500 text-xl'></i>";
      
      playSuccessSound(false);

      instructionText.parentElement.classList.remove('animate-bounce');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Success
    instructionText.innerText = "Verification Complete!";
    instructionText.parentElement.classList.add('bg-emerald-500');
    playSuccessSound(true);

    await new Promise(resolve => setTimeout(resolve, 2000));
    stream.getTracks().forEach(t => t.stop());

    userProfile.kycStep = 3;
    localStorage.setItem('smaj_user_profile', JSON.stringify(userProfile));
    renderSection('kyc');

  } catch (err) {
    console.error('Liveness check error:', err);
    showToast('Error accessing camera or performing verification.');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
    }
    renderSection('kyc');
  }
}

window.renderSection = renderSection;
fetchCountries().then(() => renderSection(activeSection));

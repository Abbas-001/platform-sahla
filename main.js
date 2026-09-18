// ==================== ربط Firebase ====================
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
  import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
  } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
  import {
    getFirestore,
    doc,
    getDoc,
    setDoc
  } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDSZwsbepwoiNlO5zJrYJ1YmrPuRb1fWAM",
    authDomain: "sahela-app.firebaseapp.com",
    projectId: "sahela-app",
    storageBucket: "sahela-app.firebasestorage.app",
    messagingSenderId: "736009727488",
    appId: "1:736009727488:web:be34f9d9bfbcbd404d32e5",
    measurementId: "G-XV60Z2KN2M"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  // ==========================================================

let currentUser = null;

let currentTab = 'courses';
let currentCourseFilter = 'الكل';
let currentProjectFilter = 'الكل';
let currentSocialFilter = 'الكل';
let searchQuery = '';

// متغيرات البيانات الخاصة بالمستخدم الحالي فقط
let courses = [];
let projects = [];
let socialIdeas = [];

// دالة تحميل بيانات المستخدم الحالي بشكل مستقل تماماً من فايربيس
async function loadUserData() {
    if (!currentUser || !currentUser.uid) return;

    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists() && snap.data().courses !== undefined) {
            const data = snap.data();
            // جلب البيانات الخاصة بهذا المستخدم فقط
            courses = data.courses || [];
            projects = data.projects || [];
            socialIdeas = data.socialIdeas || [];
        } else {
            // إذا كان المستخدم جديداً تماماً، ننشئ له محتوى افتراضي خاص بحسابه فقط
            courses = [
                {
                    id: '1',
                    name: 'دورة البرمجة بلغة JavaScript',
                    desc: 'تعلم الأساسيات والمتقدم في جافاسكريبت',
                    instructor: currentUser.name || 'مدرب الحساب',
                    instructorEmail: currentUser.email,
                    status: 'قيد الانجاز',
                    startDate: '2026-03-01',
                    endDate: '2026-04-01',
                    lectures: [
                        { title: 'المقدمة والأساسيات', link: 'https://example.com/lec1' },
                        { title: 'الدوال والكائنات', link: 'https://example.com/lec2' }
                    ]
                }
            ];
            projects = [
                {
                    id: '1',
                    projectName: 'مشروعي الأول',
                    projectDesc: 'وصف المشروع الخاص بي',
                    clientName: 'عميل تجريبي',
                    clientPhone: '07700000000',
                    clientNotes: '',
                    totalAmount: 1000,
                    paidAmount: 500,
                    projectStatus: 'قيد الانجاز',
                    projectStartDate: '2026-03-01',
                    projectDeadline: '2026-03-30',
                    projectNotes: '',
                    todos: [
                        { text: 'الخطوة الأولى', done: false }
                    ]
                }
            ];
            socialIdeas = [
                {
                    id: '1',
                    title: 'فكرتي الأولى للنشر',
                    desc: 'وصف الفكرة',
                    platform: 'تيك توك',
                    status: 'فكرة'
                }
            ];
            await saveUserData();
        }
    } catch (err) {
        showToast('تعذر تحميل البيانات، تحقق من الاتصال بالإنترنت', 'error');
        console.error(err);
    }
}

// دالة حفظ بيانات المستخدم الحالي في مستندة الخاص في فايربيس
async function saveUserData() {
    if (!currentUser || !currentUser.uid) return;
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
            name: currentUser.name,
            email: currentUser.email,
            courses,
            projects,
            socialIdeas
        }, { merge: true });
    } catch (err) {
        showToast('تعذر حفظ البيانات، تحقق من الاتصال بالإنترنت', 'error');
        console.error(err);
    }
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('auth-tab-login');
    const regTab = document.getElementById('auth-tab-register');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.className = "flex-1 py-2.5 rounded-xl font-bold text-sm transition bg-white text-cyan-600 shadow-sm";
        regTab.className = "flex-1 py-2.5 rounded-xl font-bold text-sm transition text-slate-500 hover:text-slate-700";
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        regTab.className = "flex-1 py-2.5 rounded-xl font-bold text-sm transition bg-white text-cyan-600 shadow-sm";
        loginTab.className = "flex-1 py-2.5 rounded-xl font-bold text-sm transition text-slate-500 hover:text-slate-700";
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('تم تسجيل الدخول بنجاح', 'success');
    } catch (err) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            showToast('كلمة المرور غير صحيحة', 'error');
        } else if (err.code === 'auth/user-not-found') {
            showToast('الحساب غير موجود، يرجى إنشاء حساب جديد أولاً', 'error');
        } else if (err.code === 'auth/invalid-email') {
            showToast('البريد الإلكتروني غير صالح', 'error');
        } else if (err.code === 'auth/too-many-requests') {
            showToast('محاولات كثيرة، حاول لاحقاً', 'error');
        } else {
            showToast('حدث خطأ أثناء تسجيل الدخول', 'error');
            console.error(err);
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        currentUser = { uid: cred.user.uid, name: name, email: cred.user.email };
        
        // تفريغ البيانات القديمة إن وجدت وتهيئة بيانات جديدة للمستخدم الجديد حصراً
        courses = [];
        projects = [];
        socialIdeas = [];
        
        await initApp();
        showToast('تم إنشاء الحساب وتسجيل الدخول بنجاح', 'success');
    } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
            showToast('البريد الإلكتروني مسجل مسبقاً، قم بتسجيل الدخول', 'error');
            switchAuthMode('login');
            document.getElementById('loginEmail').value = email;
        } else if (err.code === 'auth/weak-password') {
            showToast('كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل', 'error');
        } else if (err.code === 'auth/invalid-email') {
            showToast('البريد الإلكتروني غير صالح', 'error');
        } else {
            showToast('حدث خطأ أثناء إنشاء الحساب', 'error');
            console.error(err);
        }
    }
}

function logout() {
    signOut(auth).then(() => {
        currentUser = null;
        courses = [];
        projects = [];
        socialIdeas = [];
        showToast('تم تسجيل الخروج بنجاح', 'info');
    }).catch((err) => {
        showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
        console.error(err);
    });
}

async function initApp() {
    if (currentUser) {
        await loadUserData();
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('userNameDisplay').innerText = currentUser.name || currentUser.email;
        document.getElementById('userEmailDisplay').innerText = currentUser.email;
        renderCourses();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = { uid: user.uid, name: user.displayName || '', email: user.email };
    } else {
        currentUser = null;
        courses = [];
        projects = [];
        socialIdeas = [];
    }
    await initApp();
});

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('view-courses').classList.add('hidden');
    document.getElementById('view-projects').classList.add('hidden');
    document.getElementById('view-social').classList.add('hidden');

    document.getElementById('nav-courses').className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition hover:bg-slate-800 text-slate-300";
    document.getElementById('nav-projects').className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition hover:bg-slate-800 text-slate-300";
    document.getElementById('nav-social').className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition hover:bg-slate-800 text-slate-300";

    if (tab === 'courses') {
        document.getElementById('view-courses').classList.remove('hidden');
        document.getElementById('nav-courses').className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition bg-slate-800 text-white shadow-inner";
        document.getElementById('page-title').innerText = 'الدورات التدريبية';
        document.getElementById('page-icon').innerHTML = '<i class="fa-solid fa-graduation-cap"></i>';
        renderCourses();
    } else if (tab === 'projects') {
        document.getElementById('view-projects').classList.remove('hidden');
        document.getElementById('nav-projects').className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition bg-slate-800 text-white shadow-inner";
        document.getElementById('page-title').innerText = 'إدارة المشاريع';
        document.getElementById('page-icon').innerHTML = '<i class="fa-solid fa-diagram-project"></i>';
        renderProjects();
    } else if (tab === 'social') {
        document.getElementById('view-social').classList.remove('hidden');
        document.getElementById('nav-social').className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition bg-slate-800 text-white shadow-inner";
        document.getElementById('page-title').innerText = 'منصات التواصل الاجتماعي';
        document.getElementById('page-icon').innerHTML = '<i class="fa-solid fa-share-nodes"></i>';
        renderSocial();
    }
}

function handleSearch() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase();
    if (currentTab === 'courses') renderCourses();
    else if (currentTab === 'projects') renderProjects();
    else if (currentTab === 'social') renderSocial();
}

function filterCourses(status) {
    currentCourseFilter = status;
    ['الكل', 'قيد الانجاز', 'منجز', 'متوقف', 'ملغي'].forEach(s => {
        const btn = document.getElementById(`filter-course-${s}`);
        if (btn) {
            if (s === status) btn.className = "px-4 py-2 rounded-xl text-sm font-semibold transition bg-cyan-500 text-white shadow-sm";
            else btn.className = "px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 hover:bg-slate-100";
        }
    });
    renderCourses();
}

function renderCourses() {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = '';

    const filtered = courses.filter(c => {
        const matchesFilter = currentCourseFilter === 'الكل' || c.status === currentCourseFilter;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery) || c.instructor.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400">لا توجد دورات مطابقة</div>`;
        return;
    }

    filtered.forEach(c => {
        let badgeColor = 'bg-amber-100 text-amber-700';
        if (c.status === 'منجز') badgeColor = 'bg-emerald-100 text-emerald-700';
        if (c.status === 'متوقف') badgeColor = 'bg-slate-100 text-slate-700';
        if (c.status === 'ملغي') badgeColor = 'bg-rose-100 text-rose-700';

        const lecturesList = (c.lectures || []).map(l => `<li class="text-xs text-slate-600 flex justify-between items-center py-1 border-b border-slate-100 last:border-0"><span>${l.title}</span><a href="${l.link}" target="_blank" class="text-cyan-600 hover:underline">رابط المحاضرة</a></li>`).join('');

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition relative group";
        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between mb-3">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeColor}">${c.status}</span>
                    <div class="flex items-center gap-1">
                        <button onclick="editCourse('${c.id}')" class="p-1.5 text-slate-400 hover:text-cyan-600 transition"><i class="fa-solid fa-pen-to-square text-sm"></i></button>
                        <button onclick="deleteCourse('${c.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 transition"><i class="fa-solid fa-trash text-sm"></i></button>
                    </div>
                </div>
                <h3 class="font-bold text-slate-900 text-base mb-1">${c.name}</h3>
                <p class="text-xs text-slate-500 mb-4 line-clamp-2">${c.desc || 'لا يوجد وصف'}</p>
                
                <div class="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                    <div class="flex justify-between">
                        <span class="font-medium">المدرب:</span>
                        <span>${c.instructor}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">البريد الإلكتروني:</span>
                        <span class="text-slate-500">${c.instructorEmail || 'غير محدد'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">المحاضرات:</span>
                        <span class="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-md font-bold">${(c.lectures || []).length} محاضرة</span>
                    </div>
                </div>

                ${c.lectures && c.lectures.length > 0 ? `<div class="mt-3 bg-slate-50 rounded-xl p-3"><ul class="space-y-1">${lecturesList}</ul></div>` : ''}
            </div>

            <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button onclick="copyCourseDetails('${c.id}')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-copy"></i>
                    <span>نسخ تفاصيل الدورة</span>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterProjects(status) {
    currentProjectFilter = status;
    ['الكل', 'قيد الانجاز', 'منجز', 'متوقف', 'ملغي'].forEach(s => {
        const btn = document.getElementById(`filter-proj-${s}`);
        if (btn) {
            if (s === status) btn.className = "px-4 py-2 rounded-xl text-sm font-semibold transition bg-cyan-500 text-white shadow-sm";
            else btn.className = "px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 hover:bg-slate-100";
        }
    });
    renderProjects();
}

function renderProjects() {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';

    const filtered = projects.filter(p => {
        const matchesFilter = currentProjectFilter === 'الكل' || p.projectStatus === currentProjectFilter;
        const matchesSearch = p.projectName.toLowerCase().includes(searchQuery) || p.clientName.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400">لا توجد مشاريع مطابقة</div>`;
        return;
    }

    filtered.forEach(p => {
        let badgeColor = 'bg-amber-100 text-amber-700';
        if (p.projectStatus === 'منجز') badgeColor = 'bg-emerald-100 text-emerald-700';
        if (p.projectStatus === 'متوقف') badgeColor = 'bg-slate-100 text-slate-700';
        if (p.projectStatus === 'ملغي') badgeColor = 'bg-rose-100 text-rose-700';

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition relative group cursor-pointer";
        card.onclick = (e) => {
            if(e.target.closest('button')) return;
            openProjectModal(p.id);
        };
        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between mb-3">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeColor}">${p.projectStatus}</span>
                    <div class="flex items-center gap-1">
                        <button onclick="openProjectModal('${p.id}')" class="p-1.5 text-slate-400 hover:text-cyan-600 transition"><i class="fa-solid fa-pen-to-square text-sm"></i></button>
                        <button onclick="deleteProject('${p.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 transition"><i class="fa-solid fa-trash text-sm"></i></button>
                    </div>
                </div>
                <h3 class="font-bold text-slate-900 text-base mb-1">${p.projectName}</h3>
                <p class="text-xs text-slate-500 mb-4 line-clamp-2">${p.projectDesc || 'لا يوجد وصف'}</p>
                
                <div class="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                    <div class="flex justify-between">
                        <span class="font-medium">العميل:</span>
                        <span class="font-bold text-slate-800">${p.clientName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">المتبقي:</span>
                        <span class="text-cyan-600 font-bold">${Number(p.totalAmount || 0) - Number(p.paidAmount || 0)} د.ع</span>
                    </div>
                </div>
            </div>

            <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>موعد التسليم: ${p.projectDeadline || 'غير محدد'}</span>
                <span class="text-cyan-600 font-bold hover:underline">عرض التفاصيل</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterSocial(status) {
    currentSocialFilter = status;
    ['الكل', 'فكرة', 'قيد الاجراء', 'تم اكمال الاجراء'].forEach(s => {
        const btn = document.getElementById(`filter-soc-${s}`);
        if (btn) {
            if (s === status) btn.className = "px-4 py-2 rounded-xl text-sm font-semibold transition bg-cyan-500 text-white shadow-sm";
            else btn.className = "px-4 py-2 rounded-xl text-sm font-semibold transition text-slate-600 hover:bg-slate-100";
        }
    });
    renderSocial();
}

function renderSocial() {
    const grid = document.getElementById('social-grid');
    grid.innerHTML = '';

    const filtered = socialIdeas.filter(s => {
        const matchesFilter = currentSocialFilter === 'الكل' || s.status === currentSocialFilter;
        const matchesSearch = s.title.toLowerCase().includes(searchQuery) || s.desc.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400">لا توجد أفكار مطابقة</div>`;
        return;
    }

    filtered.forEach(s => {
        let badgeColor = 'bg-blue-100 text-blue-700';
        if (s.status === 'قيد الاجراء') badgeColor = 'bg-amber-100 text-amber-700';
        if (s.status === 'تم اكمال الاجراء') badgeColor = 'bg-emerald-100 text-emerald-700';

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition relative group cursor-pointer";
        card.onclick = (e) => {
            if(e.target.closest('button')) return;
            openSocialModal(s.id);
        };
        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between mb-3">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeColor}">${s.status}</span>
                    <div class="flex items-center gap-1">
                        <button onclick="openSocialModal('${s.id}')" class="p-1.5 text-slate-400 hover:text-cyan-600 transition"><i class="fa-solid fa-pen-to-square text-sm"></i></button>
                        <button onclick="deleteSocial('${s.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 transition"><i class="fa-solid fa-trash text-sm"></i></button>
                    </div>
                </div>
                <h3 class="font-bold text-slate-900 text-base mb-1">${s.title}</h3>
                <p class="text-xs text-slate-500 mb-4 line-clamp-3">${s.desc}</p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span class="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg"><i class="fa-solid fa-hashtag ml-1"></i>${s.platform}</span>
                <span class="text-cyan-600 hover:underline">تعديل الفكرة</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

let tempLectures = [];
let tempTodos = [];

function openCourseModal(id = null) {
    document.getElementById('courseModal').classList.remove('hidden');
    document.getElementById('courseModal').classList.add('flex');
    document.getElementById('lecturesContainer').innerHTML = '';
    tempLectures = [];

    if (id) {
        const c = courses.find(item => item.id === id);
        if (c) {
            document.getElementById('courseModalTitle').innerText = 'تعديل الدورة التدريبية';
            document.getElementById('courseId').value = c.id;
            document.getElementById('courseName').value = c.name;
            document.getElementById('courseDesc').value = c.desc || '';
            document.getElementById('courseInstructor').value = c.instructor;
            document.getElementById('courseInstructorEmail').value = c.instructorEmail || '';
            document.getElementById('courseStatus').value = c.status;
            document.getElementById('courseStartDate').value = c.startDate || '';
            document.getElementById('courseEndDate').value = c.endDate || '';
            tempLectures = c.lectures ? [...c.lectures] : [];
        }
    } else {
        document.getElementById('courseModalTitle').innerText = 'إضافة دورة جديدة';
        document.getElementById('courseForm').reset();
        document.getElementById('courseId').value = '';
        tempLectures = [{ title: 'المحاضرة الأولى', link: '' }];
    }
    renderLecturesInputs();
}

function closeCourseModal() {
    document.getElementById('courseModal').classList.add('hidden');
    document.getElementById('courseModal').classList.remove('flex');
}

function addLectureInput() {
    tempLectures.push({ title: '', link: '' });
    renderLecturesInputs();
}

function renderLecturesInputs() {
    const container = document.getElementById('lecturesContainer');
    container.innerHTML = '';
    tempLectures.forEach((l, idx) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2";
        div.innerHTML = `
            <input type="text" placeholder="عنوان المحاضرة" value="${l.title}" oninput="updateLecture(${idx}, 'title', this.value)" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500">
            <input type="url" placeholder="رابط المحاضرة" value="${l.link}" oninput="updateLecture(${idx}, 'link', this.value)" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500">
            <button type="button" onclick="removeLecture(${idx})" class="text-rose-400 hover:text-rose-600 p-1"><i class="fa-solid fa-trash text-xs"></i></button>
        `;
        container.appendChild(div);
    });
}

function updateLecture(idx, field, val) {
    tempLectures[idx][field] = val;
}

function removeLecture(idx) {
    tempLectures.splice(idx, 1);
    renderLecturesInputs();
}

function saveCourse(e) {
    e.preventDefault();
    const id = document.getElementById('courseId').value;
    const data = {
        id: id ? id : Date.now().toString(),
        name: document.getElementById('courseName').value,
        desc: document.getElementById('courseDesc').value,
        instructor: document.getElementById('courseInstructor').value,
        instructorEmail: document.getElementById('courseInstructorEmail').value,
        status: document.getElementById('courseStatus').value,
        startDate: document.getElementById('courseStartDate').value,
        endDate: document.getElementById('courseEndDate').value,
        lectures: tempLectures
    };

    if (id) {
        const idx = courses.findIndex(c => c.id === id);
        if (idx !== -1) courses[idx] = data;
        showToast('تم تحديث الدورة بنجاح', 'success');
    } else {
        courses.push(data);
        showToast('تمت إضافة الدورة بنجاح', 'success');
    }

    saveUserData();
    closeCourseModal();
    renderCourses();
}

function editCourse(id) {
    openCourseModal(id);
}

function deleteCourse(id) {
    if (confirm('هل أنت متأكد من حذف هذه الدورة؟')) {
        courses = courses.filter(c => c.id !== id);
        saveUserData();
        renderCourses();
        showToast('تم حذف الدورة بنجاح', 'info');
    }
}

function copyCourseDetails(id) {
    const c = courses.find(item => item.id === id);
    if(!c) return;
    let text = `اسم الدورة: ${c.name}\nالمدرب: ${c.instructor}\nالبريد الإلكتروني: ${c.instructorEmail || 'غير محدد'}\nالوصف: ${c.desc}\nالحالة: ${c.status}\nالمحاضرات:\n`;
    (c.lectures || []).forEach((l, i) => {
        text += `${i+1}. ${l.title} - ${l.link}\n`;
    });
    navigator.clipboard.writeText(text);
    showToast('تم نسخ تفاصيل الدورة بنجاح', 'success');
}

function openProjectModal(id = null) {
    document.getElementById('projectModal').classList.remove('hidden');
    document.getElementById('projectModal').classList.add('flex');
    tempTodos = [];

    if (id) {
        const p = projects.find(item => item.id === id);
        if (p) {
            document.getElementById('projectModalTitle').innerText = 'تعديل تفاصيل المشروع';
            document.getElementById('projectId').value = p.id;
            document.getElementById('projectName').value = p.projectName;
            document.getElementById('projectDesc').value = p.projectDesc || '';
            document.getElementById('clientName').value = p.clientName;
            document.getElementById('clientPhone').value = p.clientPhone || '';
            document.getElementById('clientNotes').value = p.clientNotes || '';
            document.getElementById('totalAmount').value = p.totalAmount || 0;
            document.getElementById('paidAmount').value = p.paidAmount || 0;
            document.getElementById('projectStatus').value = p.projectStatus;
            document.getElementById('projectStartDate').value = p.projectStartDate || '';
            document.getElementById('projectDeadline').value = p.projectDeadline || '';
            document.getElementById('projectNotes').value = p.projectNotes || '';
            tempTodos = p.todos ? [...p.todos] : [];
        }
    } else {
        document.getElementById('projectModalTitle').innerText = 'إضافة مشروع جديد';
        document.getElementById('projectForm').reset();
        document.getElementById('projectId').value = '';
        document.getElementById('totalAmount').value = 0;
        document.getElementById('paidAmount').value = 0;
        tempTodos = [{ text: 'تحديد متطلبات المشروع الأولية', done: false }];
    }
    calculateRemaining();
    renderTodoInputs();
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.add('hidden');
    document.getElementById('projectModal').classList.remove('flex');
}

function calculateRemaining() {
    const total = Number(document.getElementById('totalAmount').value) || 0;
    const paid = Number(document.getElementById('paidAmount').value) || 0;
    const rem = total - paid;
    document.getElementById('remainingAmountDisplay').innerText = rem + ' د.ع';
}

function addTodoItem() {
    tempTodos.push({ text: '', done: false });
    renderTodoInputs();
}

function renderTodoInputs() {
    const container = document.getElementById('todoContainer');
    container.innerHTML = '';
    tempTodos.forEach((t, idx) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2";
        div.innerHTML = `
            <input type="checkbox" ${t.done ? 'checked' : ''} onchange="updateTodo(${idx}, 'done', this.checked)" class="w-4 h-4 text-cyan-600 rounded">
            <input type="text" placeholder="عنوان المهمة / القسم" value="${t.text}" oninput="updateTodo(${idx}, 'text', this.value)" class="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500">
            <button type="button" onclick="removeTodo(${idx})" class="text-rose-400 hover:text-rose-600 p-1"><i class="fa-solid fa-trash text-xs"></i></button>
        `;
        container.appendChild(div);
    });
}

function updateTodo(idx, field, val) {
    tempTodos[idx][field] = val;
}

function removeTodo(idx) {
    tempTodos.splice(idx, 1);
    renderTodoInputs();
}

function saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const data = {
        id: id ? id : Date.now().toString(),
        projectName: document.getElementById('projectName').value,
        projectDesc: document.getElementById('projectDesc').value,
        clientName: document.getElementById('clientName').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientNotes: document.getElementById('clientNotes').value,
        totalAmount: document.getElementById('totalAmount').value,
        paidAmount: document.getElementById('paidAmount').value,
        projectStatus: document.getElementById('projectStatus').value,
        projectStartDate: document.getElementById('projectStartDate').value,
        projectDeadline: document.getElementById('projectDeadline').value,
        projectNotes: document.getElementById('projectNotes').value,
        todos: tempTodos
    };

    if (id) {
        const idx = projects.findIndex(p => p.id === id);
        if (idx !== -1) projects[idx] = data;
        showToast('تم تحديث المشروع بنجاح', 'success');
    } else {
        projects.push(data);
        showToast('تمت إضافة المشروع بنجاح', 'success');
    }

    saveUserData();
    closeProjectModal();
    renderProjects();
}

function deleteProject(id) {
    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
        projects = projects.filter(p => p.id !== id);
        saveUserData();
        renderProjects();
        showToast('تم حذف المشروع بنجاح', 'info');
    }
}

function openSocialModal(id = null) {
    document.getElementById('socialModal').classList.remove('hidden');
    document.getElementById('socialModal').classList.add('flex');

    if (id) {
        const s = socialIdeas.find(item => item.id === id);
        if (s) {
            document.getElementById('socialModalTitle').innerText = 'تعديل فكرة السوشيال ميديا';
            document.getElementById('socialId').value = s.id;
            document.getElementById('socialTitle').value = s.title;
            document.getElementById('socialDesc').value = s.desc;
            document.getElementById('socialPlatform').value = s.platform;
            document.getElementById('socialStatus').value = s.status;
        }
    } else {
        document.getElementById('socialModalTitle').innerText = 'إضافة فكرة جديدة';
        document.getElementById('socialForm').reset();
        document.getElementById('socialId').value = '';
    }
}

function closeSocialModal() {
    document.getElementById('socialModal').classList.add('hidden');
    document.getElementById('socialModal').classList.remove('flex');
}

function saveSocial(e) {
    e.preventDefault();
    const id = document.getElementById('socialId').value;
    const data = {
        id: id ? id : Date.now().toString(),
        title: document.getElementById('socialTitle').value,
        desc: document.getElementById('socialDesc').value,
        platform: document.getElementById('socialPlatform').value,
        status: document.getElementById('socialStatus').value
    };

    if (id) {
        const idx = socialIdeas.findIndex(s => s.id === id);
        if (idx !== -1) socialIdeas[idx] = data;
        showToast('تم تحديث الفكرة بنجاح', 'success');
    } else {
        socialIdeas.push(data);
        showToast('تمت إضافة الفكرة بنجاح', 'success');
    }

    saveUserData();
    closeSocialModal();
    renderSocial();
}

function deleteSocial(id) {
    if (confirm('هل أنت متأكد من حذف هذه الفكرة؟')) {
        socialIdeas = socialIdeas.filter(s => s.id !== id);
        saveUserData();
        renderSocial();
        showToast('تم حذف الفكرة بنجاح', 'info');
    }
}

function exportData() {
    const exportObj = { courses, projects, socialIdeas };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "sahela_backup.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('تم تصدير البيانات بنجاح', 'success');
}

function importData(event) {
    const fileReader = new FileReader();
    if (event.target.files[0]) {
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.courses) courses = parsed.courses;
                if (parsed.projects) projects = parsed.projects;
                if (parsed.socialIdeas) socialIdeas = parsed.socialIdeas;
                
                saveUserData();
                switchTab(currentTab);
                showToast('تم استيراد البيانات بنجاح', 'success');
            } catch (err) {
                showToast('خطأ في قراءة الملف', 'error');
            }
        };
    }
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMsg');
    const iconEl = document.getElementById('toastIcon');

    msgEl.innerText = msg;
    if (type === 'success') {
        iconEl.className = "fa-solid fa-circle-check text-emerald-400";
    } else if (type === 'error') {
        iconEl.className = "fa-solid fa-circle-xmark text-rose-400";
    } else {
        iconEl.className = "fa-solid fa-circle-info text-cyan-400";
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

window.switchAuthMode = switchAuthMode;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.switchTab = switchTab;
window.handleSearch = handleSearch;
window.filterCourses = filterCourses;
window.openCourseModal = openCourseModal;
window.closeCourseModal = closeCourseModal;
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.copyCourseDetails = copyCourseDetails;
window.addLectureInput = addLectureInput;
window.updateLecture = updateLecture;
window.removeLecture = removeLecture;
window.saveCourse = saveCourse;
window.filterProjects = filterProjects;
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.calculateRemaining = calculateRemaining;
window.addTodoItem = addTodoItem;
window.updateTodo = updateTodo;
window.removeTodo = removeTodo;
window.saveProject = saveProject;
window.deleteProject = deleteProject;
window.filterSocial = filterSocial;
window.openSocialModal = openSocialModal;
window.closeSocialModal = closeSocialModal;
window.saveSocial = saveSocial;
window.deleteSocial = deleteSocial;
window.exportData = exportData;
window.importData = importData;

const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = menuBtn.querySelector('svg');

// svg menu path
const hamburgerPath = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>`;
const closePath = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>`;

function toggleMenu() {
    //toggle mobile menu 
    mobileMenu.classList.toggle('opacity-0');
    mobileMenu.classList.toggle('-translate-y-4');
    mobileMenu.classList.toggle('pointer-events-none');

    mobileMenu.classList.toggle('opacity-100');
    mobileMenu.classList.toggle('translate-y-0');
    mobileMenu.classList.toggle('pointer-events-auto');

    //swap the icon 
    if (mobileMenu.classList.contains('opacity-100')) {
        menuIcon.innerHTML = closePath; 
        menuIcon.classList.add('rotate-90');
    } else {
        menuIcon.innerHTML = hamburgerPath; 
        menuIcon.classList.remove('rotate-90');
    }
}

menuBtn.addEventListener('click', toggleMenu);

//close menu automatically when a link is clicked 
const mobileLinks = document.querySelectorAll('.mobile-link');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('opacity-100')) {
            toggleMenu();
        }
    });
});
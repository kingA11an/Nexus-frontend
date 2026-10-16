"""
Loads the content that used to be hardcoded in index.html into the new
admin-managed models. Safe to run more than once: a table that already has
rows is left alone.

    python manage.py seed_content

Images are referenced by their existing path inside Images/ (the media root),
so no files are copied, moved or renamed.
"""
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from shop.models import (
    Category,
    FeaturedCategory,
    FeaturedCategoryImage,
    Highlight,
    ImpactStat,
    Location,
    Project,
)

# (image path inside Images/, caption, alt text)
# Alt text is drafted from the captions and file names; please review it
# against the photos in the admin.
HIGHLIGHTS = [
    ('project gallery/ntc-nairobi.jpeg', 'Calm-down corner', 'Calm-down corner set up at the NTC Nairobi centre'),
    ('project gallery/ntc-nairobi (1).jpeg', 'Sensory room setup', 'Sensory room set up at the NTC Nairobi centre'),
    ('project gallery/ntc-nairobi (2).jpeg', 'Visit by Hon. Dr. Isaac Mwaura', 'Hon. Dr. Isaac Mwaura visiting the NTC Nairobi centre'),
    ('project gallery/ntc-nairobi (3).jpeg', 'Sensory room setup', 'Second view of the sensory room at the NTC Nairobi centre'),
    ('project gallery/andySpeaksHq.jpeg', 'Child playing', 'Child playing at the Andy Speaks headquarters'),
    ('project gallery/ntc-nakuru.jpeg', 'Nakuru mobile room setup', 'Mobile sensory room set up in Nakuru'),
    ('project gallery/pangani-highlight.jpeg', 'Pangani donations', 'Equipment donations at Pangani Special School'),
    ('project gallery/pangani-highlight (1).jpg', 'Room setup', 'Room set up at Pangani Special School'),
    ('project gallery/pangani-highlight (2).jpg', 'Sensory room setup', 'Sensory room equipment at Pangani Special School'),
    ('project gallery/pangani-highlight (3).jpg', 'Pangani room setup', 'Completed room setup at Pangani Special School'),
    ('project gallery/kasarani-highlight.jpg', 'Kasarani special school donations', 'Equipment donations at the Kasarani Primary School autism unit'),
    ('project gallery/kasarani-highlight (1).jpg', 'Kasarani classroom setup', 'Classroom set up at the Kasarani Primary School autism unit'),
    ('project gallery/garissa-highlight.jpg', 'Garissa awareness event', 'Awareness event in Garissa'),
    ('project gallery/garissa-highlight (1).jpg', 'Garissa parent training', 'Parent training session in Garissa'),
    ('project gallery/garissa-highlight (2).jpg', 'Garissa donations', 'Equipment donations in Garissa'),
    ('project gallery/carovana-school.jpeg', 'Urafiki Carovana School', 'Inclusive classroom at Urafiki Carovana School'),
    ('project gallery/carovana-school-3.jpeg', 'Urafiki Carovana School', 'Learning equipment at Urafiki Carovana School'),
    ('project gallery/carovana-school-5.jpeg', 'Urafiki Carovana School', 'Completed setup at Urafiki Carovana School'),
    ('project gallery/kasarani-furniture-repaint.jpeg', 'Kasarani furniture repaint', 'Classroom furniture being repainted at Kasarani Primary School'),
    ('project gallery/kasarani-complete.jpeg', 'Kasarani completed setup', 'Completed classroom setup at Kasarani Primary School'),
    ('project gallery/home-setup-nrb-sensory-space.jpeg', 'Home sensory space, Nairobi', 'Sensory space set up in a home in Nairobi'),
    ('project gallery/home-setup-nrb-sensory-room.jpeg', 'Home sensory room, Nairobi', 'Sensory room set up in a home in Nairobi'),
    ('project gallery/home-setup-nairobi-sensory-garden.jpeg', 'Home sensory garden, Nairobi', 'Sensory garden set up at a home in Nairobi'),
    ('project gallery/home-setup-nairobi-room-setup.jpeg', 'Home setup, Nairobi', 'Room set up in a home in Nairobi'),
    ('project gallery/garissa-doctor-training.jpeg', 'Garissa doctor training', 'Training session for doctors in Garissa'),
    ('project gallery/nairobi-autism-classroom.jpeg', 'Nairobi autism classroom', 'Autism classroom in Nairobi'),
    ('project gallery/garissa-parent-training.jpeg', 'Garissa parent training', 'Parents attending a training session in Garissa'),
]

# section, badge, title, description, (image_1, alt_1, label_1), (image_2, alt_2, label_2) or None
PROJECTS = [
    ('csr', 'CSR Project', 'Pangani Special School',
     'A complete sensory room transformation. See how we turn empty spaces into engaging environments.',
     ('pangani-special-school-before.jpg', 'Pangani Special School before the sensory room transformation', 'Before'),
     ('pangani-special-school-after.jpg', 'Pangani Special School after the sensory room transformation', 'After')),
    ('csr', 'Public CSR Project', 'Kasarani Primary School Autism Unit',
     'CSR project supplying inclusive learning and therapy equipment to a public-school autism unit.',
     ('kasarani-school-before.jpg', 'Kasarani Primary School autism unit before the equipment donation', 'Before'),
     ('kasarani-school-after.jpg', 'Kasarani Primary School autism unit after the equipment donation', 'After')),
    ('csr', 'Public School', 'Dagoretti Special School',
     'Equipment and space development supporting learners at a special school.',
     ('dagoretti-special-school-view-1.jpeg', 'Equipped space at Dagoretti Special School, first view', 'View 1'),
     ('dagoretti-special-school-view-2.jpeg', 'Equipped space at Dagoretti Special School, second view', 'View 2')),
    ('csr', 'Kilifi · Public Unit', 'Mnarani Primary School Special Needs Unit, Kilifi',
     'Community and school-impact project equipping a special-needs unit.',
     ('mnarani-equipment-donation.jpeg', 'Equipment donated to the Mnarani Primary School special needs unit', 'View 1'),
     ('mnarani-donation.jpeg', 'Second view of the donation to the Mnarani Primary School special needs unit', 'View 2')),
    # The original page used the same file for both slides of this card, so only one photo is seeded.
    ('institutional', 'Nairobi', 'Tumaini Autism Centre',
     'Assessment, design and set-up of sensory and therapy learning spaces.',
     ('tumaini-autism-center.jpeg', 'Sensory and therapy learning space at Tumaini Autism Centre', 'View 1'),
     None),
    ('institutional', 'School Unit', 'Urafiki Carovana School',
     'Equipment and inclusive-classroom support from challenge through to installation.',
     ('carovana-school-2.jpeg', 'Classroom at Urafiki Carovana School, first view', 'View 1'),
     ('carovana-school-4.jpeg', 'Classroom at Urafiki Carovana School, second view', 'View 2')),
    ('institutional', 'Therapy Network', 'Nexus Therapy Centres',
     'Design and equipment evolution across a growing therapy-centre network.',
     ('nexus-therapy-center.jpeg', 'Nexus therapy centre, first view', 'View 1'),
     ('nexus-therapy-center (2).jpeg', 'Nexus therapy centre, second view', 'View 2')),
]

IMPACT = [
    (5000, '+', 'assistive products supplied'),
    (1772, '', 'learners supported through assistive devices and learning-support equipment'),
    (11, '', 'settings served: schools, therapy centres, homes and community institutions'),
]

# title, Category.name the tile links to, image file prefix (files are <prefix>-1.jpg ... <prefix>-4.jpg)
FEATURED = [
    ('Sensory Tools', 'Sensory & Furniture', 'sensory'),
    ('Therapy Equipment', 'Motor Skills', 'therapy'),
    ('Learning Aids', 'Education & Speech', 'learning'),
    ('Adaptive & Daily Living', 'ADL Training', 'adl'),
]

LOCATIONS = [
    ('Nairobi', 'Leomar Court,\nHse 10, 45 Westlands Road', '0716 951 777'),
    ('Nakuru', 'Inside CITAM Nakuru\nOff Nairobi-Nakuru Highway', '0728 671 471'),
    ('Kiambu', 'Inside Firm Start Academy', '0733 671 471'),
]


class Command(BaseCommand):
    help = 'Load the previously hardcoded homepage content into the database.'

    def handle(self, *args, **options):
        self.missing = []
        media_root = Path(settings.MEDIA_ROOT)

        def img(path):
            if not (media_root / path).is_file():
                self.missing.append(path)
            return path

        if Highlight.objects.exists():
            self.stdout.write('Highlights: already present, skipped')
        else:
            Highlight.objects.bulk_create([
                Highlight(image=img(path), caption=caption, image_alt=alt, display_order=i)
                for i, (path, caption, alt) in enumerate(HIGHLIGHTS, start=1)
            ])
            self.stdout.write(f'Highlights: created {len(HIGHLIGHTS)}')

        if Project.objects.exists():
            self.stdout.write('Projects: already present, skipped')
        else:
            for i, (section, badge, title, desc, first, second) in enumerate(PROJECTS, start=1):
                Project.objects.create(
                    section=section, badge=badge, title=title, description=desc,
                    image_1=img(first[0]), image_1_alt=first[1], label_1=first[2],
                    image_2=img(second[0]) if second else None,
                    image_2_alt=second[1] if second else '',
                    label_2=second[2] if second else 'After',
                    display_order=i,
                )
            self.stdout.write(f'Projects: created {len(PROJECTS)}')

        if ImpactStat.objects.exists():
            self.stdout.write('Impact stats: already present, skipped')
        else:
            for i, (value, suffix, label) in enumerate(IMPACT, start=1):
                ImpactStat.objects.create(value=value, suffix=suffix, label=label, display_order=i)
            self.stdout.write(f'Impact stats: created {len(IMPACT)}')

        if FeaturedCategory.objects.exists():
            self.stdout.write('Featured categories: already present, skipped')
        else:
            for i, (title, category_name, prefix) in enumerate(FEATURED, start=1):
                category = Category.objects.filter(name=category_name).first()
                if category is None:
                    self.stdout.write(self.style.WARNING(
                        f'  No category named "{category_name}"; "{title}" will link to the full shop '
                        f'until you pick one in the admin.'
                    ))
                tile = FeaturedCategory.objects.create(title=title, category=category, display_order=i)
                for n in range(1, 5):
                    FeaturedCategoryImage.objects.create(
                        featured_category=tile, image=img(f'{prefix}-{n}.jpg'), display_order=n,
                    )
            self.stdout.write(f'Featured categories: created {len(FEATURED)}')

        if Location.objects.exists():
            self.stdout.write('Locations: already present, skipped')
        else:
            for i, (city, address, phone) in enumerate(LOCATIONS, start=1):
                Location.objects.create(city=city, address=address, phone=phone, display_order=i)
            self.stdout.write(f'Locations: created {len(LOCATIONS)}')

        if self.missing:
            self.stdout.write(self.style.WARNING(
                'These files were not found under Images/ (check spelling and letter case, '
                'Linux servers are case-sensitive):'
            ))
            for path in sorted(set(self.missing)):
                self.stdout.write(f'  {path}')

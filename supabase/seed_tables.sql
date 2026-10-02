CREATE TABLE IF NOT EXISTS public.members (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    first_name_en VARCHAR(100),
    last_name_en VARCHAR(100),
    major VARCHAR(100),
    major_en VARCHAR(100),
    sub_major VARCHAR(100),
    sub_major_en VARCHAR(100),
    status VARCHAR(100),
    status_en VARCHAR(100),
    university VARCHAR(150),
    university_en VARCHAR(150),
    track VARCHAR(100),
    track_en VARCHAR(100),
    bio TEXT,
    bio_en TEXT,
    portfolio_url TEXT,
    x_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    event_id INTEGER NOT NULL,
    full_name VARCHAR(150),
    email VARCHAR(150),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add open policies for local development
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read members" ON public.members;
CREATE POLICY "Allow read members" ON public.members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write members" ON public.members;
CREATE POLICY "Allow write members" ON public.members FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read registrations" ON public.event_registrations;
CREATE POLICY "Allow read registrations" ON public.event_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert registrations" ON public.event_registrations;
CREATE POLICY "Allow insert registrations" ON public.event_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update registrations" ON public.event_registrations;
CREATE POLICY "Allow update registrations" ON public.event_registrations FOR UPDATE USING (true);

-- Insert sample members
DELETE FROM public.members;

INSERT INTO public.members (
  first_name, last_name, first_name_en, last_name_en,
  major, major_en, sub_major, sub_major_en,
  status, status_en, university, university_en,
  track, track_en, bio, bio_en,
  portfolio_url, x_url, linkedin_url, github_url
) VALUES 
('سعود', 'محمد', 'Saud', 'Mohammed', 'علوم حاسب', 'Computer Science', 'هندسة برمجيات', 'Software Engineering', 'خريج', 'Graduate', 'جامعة الملك سعود', 'King Saud University', 'تطوير الويب', 'Web Development', 'مطور واجهات ومتحمس للمصادر المفتوحة وبناء الحلول الرقمية.', 'Frontend developer passionate about open-source and digital solutions.', 'https://github.com', 'https://x.com', 'https://linkedin.com', 'https://github.com'),
('سارة', 'العتيبي', 'Sara', 'Alotaibi', 'ذكاء اصطناعي', 'Artificial Intelligence', 'تعلم الآلة', 'Machine Learning', 'طالب', 'Student', 'جامعة الأميرة نورة', 'Princess Nourah University', 'الذكاء الاصطناعي', 'AI Track', 'مهتمة بنماذج اللغات الكبيرة وتطبيقات الرؤية الحاسوبية.', 'Interested in LLMs and computer vision applications.', 'https://github.com', 'https://x.com', 'https://linkedin.com', 'https://github.com'),
('عبدالله', 'الغامدي', 'Abdullah', 'Alghamdi', 'أمن سيبراني', 'Cybersecurity', 'أمن الشبكات', 'Network Security', 'موظف', 'Employee', 'جامعة الملك عبدالعزيز', 'King Abdulaziz University', 'الأمن السيبراني', 'Cybersecurity', 'مختص باختبار الاختراق وحماية البنية التحتية السحابية.', 'Specialist in penetration testing and cloud infrastructure protection.', 'https://github.com', 'https://x.com', 'https://linkedin.com', 'https://github.com');

-- Insert sample registration for event 1
DELETE FROM public.event_registrations;
INSERT INTO public.event_registrations (event_id, full_name, email, status)
VALUES 
(1, 'سعود محمد', 'test@sdc.org.sa', 'pending'),
(1, 'أحمد علي', 'ahmed@example.com', 'pending');

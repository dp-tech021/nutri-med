-- Initial product taxonomy requested for discovery, NOT certification or legal eligibility.
-- Keep existing/custom labels untouched; safe to run more than once.
insert into public.health_professions(slug, label) values
  ('medico', 'Médico'),
  ('nutricionista', 'Nutricionista'),
  ('psicologo', 'Psicólogo'),
  ('fisioterapeuta', 'Fisioterapeuta'),
  ('outro-profissional-saude', 'Outro profissional da saúde')
on conflict (slug) do nothing;

-- specialty is currently mandatory. This neutral technical option does not
-- assert a recognized medical specialty, certification or right to practice.
insert into public.health_specialties(profession, slug, label) values
  ('medico', 'atuacao-geral', 'Atuação geral informada'),
  ('nutricionista', 'atuacao-geral', 'Atuação geral informada'),
  ('psicologo', 'atuacao-geral', 'Atuação geral informada'),
  ('fisioterapeuta', 'atuacao-geral', 'Atuação geral informada'),
  ('outro-profissional-saude', 'atuacao-geral', 'Atuação geral informada')
on conflict (profession, slug) do nothing;

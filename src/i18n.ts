import { useSyncExternalStore } from "react";

export type Lang = "uz" | "ru";

const D = {
  // common
  next: ["Davom etish", "Далее"],
  back: ["Orqaga", "Назад"],
  save: ["Saqlash", "Сохранить"],
  cancel: ["Bekor qilish", "Отмена"],
  done: ["Tayyor", "Готово"],
  start: ["Boshlash", "Начать"],
  loading: ["Yuklanmoqda…", "Загрузка…"],
  error: ["Xatolik. Qayta urinib koʻring", "Ошибка. Попробуйте ещё раз"],
  retry: ["Qayta urinish", "Повторить"],
  min: ["daq", "мин"],
  sec: ["s", "с"],
  kg: ["kg", "кг"],
  cm: ["sm", "см"],
  kcal: ["kkal", "ккал"],
  g: ["g", "г"],
  ml: ["ml", "мл"],
  reps: ["takror", "повт."],
  sets: ["yondashuv", "подхода"],
  week: ["Hafta", "Неделя"],
  day: ["Kun", "День"],
  days_week: ["kun/hafta", "дн/нед"],
  weeks: ["hafta", "нед."],
  premium: ["Premium", "Premium"],
  free: ["Bepul", "Бесплатно"],
  demo: ["Demo rejim: maʼlumotlar faqat shu brauzerda saqlanadi", "Демо-режим: данные хранятся только в этом браузере"],

  // tabs
  tab_today: ["Bugun", "Сегодня"],
  tab_train: ["Mashqlar", "Тренировки"],
  tab_food: ["Ovqat", "Питание"],
  tab_progress: ["Natija", "Прогресс"],
  tab_profile: ["Profil", "Профиль"],

  // onboarding
  ob_hello: ["SPARTA’ga xush kelibsiz", "Добро пожаловать в SPARTA"],
  ob_hello_sub: ["Shaxsiy murabbiy va dietolog — bir ilovada. 1 daqiqalik anketa va reja tayyor.", "Личный тренер и диетолог в одном приложении. Анкета на 1 минуту — и план готов."],
  ob_lang: ["Tilni tanlang", "Выберите язык"],
  ob_step: ["Qadam", "Шаг"],
  ob_sex: ["Jinsingiz", "Ваш пол"],
  male: ["Erkak", "Мужчина"],
  female: ["Ayol", "Женщина"],
  ob_body: ["Tana parametrlari", "Параметры тела"],
  birth_year: ["Tugʻilgan yil", "Год рождения"],
  height: ["Boʻy", "Рост"],
  weight: ["Vazn", "Вес"],
  target_weight: ["Maqsad vazni (ixtiyoriy)", "Целевой вес (необязательно)"],
  ob_goal: ["Asosiy maqsad", "Главная цель"],
  goal_lose: ["Ozish", "Похудеть"],
  goal_lose_d: ["Yogʻni kamaytirish, qomatni tortish", "Снизить жир, подтянуть фигуру"],
  goal_gain: ["Massa olish", "Набрать массу"],
  goal_gain_d: ["Mushak massasini oshirish", "Нарастить мышцы"],
  goal_tone: ["Qomatni chiroyli qilish", "Подтянуть тело"],
  goal_tone_d: ["Tarang mushaklar, kam yogʻ", "Рельеф и тонус без лишнего веса"],
  goal_strength: ["Kuchliroq boʻlish", "Стать сильнее"],
  goal_strength_d: ["Tortilish, otjimaniya, rekordlar", "Подтягивания, отжимания, рекорды"],
  goal_health: ["Sogʻlom boʻlish", "Здоровье и энергия"],
  goal_health_d: ["Faollik, yaxshi kayfiyat, sogʻlom bel", "Активность, бодрость, здоровая спина"],
  ob_level: ["Tayyorgarlik darajasi", "Уровень подготовки"],
  level_beginner: ["Yangi boshlovchi", "Новичок"],
  level_beginner_d: ["Muntazam shugʻullanmaganman", "Не тренируюсь регулярно"],
  level_intermediate: ["Oʻrta", "Средний"],
  level_intermediate_d: ["6+ oy shugʻullanaman", "Тренируюсь 6+ месяцев"],
  level_advanced: ["Tajribali", "Опытный"],
  level_advanced_d: ["2+ yil, texnikani bilaman", "2+ года, знаю технику"],
  ob_place: ["Qayerda shugʻullanasiz?", "Где будете тренироваться?"],
  place_home: ["Uyda", "Дома"],
  place_outdoor: ["Hovlida (turnik, brusya)", "Во дворе (турник, брусья)"],
  place_gym: ["Zalda", "В зале"],
  place_any: ["Turli joyda", "Где придётся"],
  ob_equipment: ["Qanday jihozlar bor?", "Какой инвентарь есть?"],
  ob_days: ["Haftada necha kun?", "Сколько дней в неделю?"],
  ob_days_sub: ["Boshlash uchun 3 kun — eng yaxshi tanlov", "Для старта 3 дня — оптимально"],
  ob_health: ["Sogʻliq", "Здоровье"],
  ob_health_sub: ["Xavfli mashqlarni belgilaymiz. Hech narsa boʻlmasa — oʻtkazib yuboring", "Пометим рискованные упражнения. Если ничего нет — пропустите"],
  h_knees: ["Tizzalar", "Колени"],
  h_back: ["Bel / orqa", "Спина / поясница"],
  h_shoulders: ["Yelkalar", "Плечи"],
  h_pressure: ["Qon bosimi", "Давление"],
  h_heart: ["Yurak", "Сердце"],
  h_diabetes: ["Diabet", "Диабет"],
  h_pregnancy: ["Homiladorlik", "Беременность"],
  ob_calc: ["Rejangiz tayyorlanmoqda…", "Готовим Ваш план…"],
  ob_result: ["Shaxsiy rejangiz", "Ваш личный план"],
  ob_result_sub: ["Hisob Mifflin–San Jeor formulasi va maqsadingiz boʻyicha", "Расчёт по формуле Миффлина–Сан Жеора и Вашей цели"],
  per_day: ["kuniga", "в день"],
  protein: ["Oqsil", "Белки"],
  fat: ["Yogʻ", "Жиры"],
  carbs: ["Uglevod", "Углеводы"],
  water: ["Suv", "Вода"],
  bmi: ["TMI", "ИМТ"],
  bmi_under: ["Vazn yetishmaydi", "Недостаток веса"],
  bmi_normal: ["Meʼyorda", "Норма"],
  bmi_over: ["Ortiqcha vazn", "Избыточный вес"],
  bmi_obese: ["Semizlik", "Ожирение"],
  rec_programs: ["Sizga mos dasturlar", "Подходящие программы"],
  go_today: ["Mashgʻulotlarni boshlash", "Перейти к тренировкам"],
  note_underweight: ["Vazn kam — kaloriya kamaytirilmaydi", "Вес ниже нормы — дефицит калорий не применяем"],
  note_pregnancy: ["Homiladorlikda — faqat shifokor ruxsati bilan", "При беременности — только с разрешения врача"],
  note_minor: ["18 yoshgacha — yumshoq meʼyorlar", "До 18 лет — мягкие нормы"],
  note_floor: ["Kaloriya xavfsiz minimumdan past tushmaydi", "Калории не ниже безопасного минимума"],
  note_medical: ["Shifokor bilan maslahatlashing", "Проконсультируйтесь с врачом"],

  // today
  hello: ["Salom", "Привет"],
  today_plan: ["Bugungi mashgʻulot", "Тренировка на сегодня"],
  no_program: ["Dastur tanlanmagan", "Программа не выбрана"],
  no_program_sub: ["Maqsadingizga mos dasturni tanlang — har kuni nima qilishni aniq bilasiz", "Выберите программу под цель — каждый день будете знать, что делать"],
  choose_program: ["Dastur tanlash", "Выбрать программу"],
  trained_today: ["Bugun mashq qildingiz 💪", "Сегодня Вы уже тренировались 💪"],
  rest_day: ["Bugun dam olish kuni", "Сегодня день отдыха"],
  streak: ["Seriya", "Серия"],
  days_short: ["kun", "дн."],
  level: ["Unvon", "Звание"],
  recovery: ["Mushaklar tiklanishi", "Восстановление мышц"],
  recovery_sub: ["Yashil — tayyor, qizil — dam kerak", "Зелёный — готовы, красный — нужен отдых"],
  nutrition_today: ["Bugungi ovqat", "Питание сегодня"],
  eaten: ["yeildi", "съедено"],
  left: ["qoldi", "осталось"],
  add_water: ["+250 ml", "+250 мл"],

  // train
  by_muscle: ["Mushak boʻyicha", "По мышцам"],
  programs: ["Dasturlar", "Программы"],
  front: ["Old", "Спереди"],
  rear: ["Orqa", "Сзади"],
  tap_muscle: ["Mushakni bosing", "Нажмите на мышцу"],
  exercises_n: ["mashq", "упр."],
  all_places: ["Hammasi", "Все"],
  my_equipment: ["Faqat mening jihozlarim", "Только мой инвентарь"],
  caution: ["Ehtiyot boʻling", "Осторожно"],
  caution_d: ["Anketangiz boʻyicha bu mashq siz uchun xavfli boʻlishi mumkin", "По Вашей анкете упражнение может быть рискованным"],
  technique: ["Texnika", "Техника"],
  mistakes: ["Koʻp uchraydigan xatolar", "Частые ошибки"],
  target_muscles: ["Ishlaydigan mushaklar", "Работающие мышцы"],
  primary: ["Asosiy", "Основная"],
  secondary: ["Yordamchi", "Вспомогательные"],
  equipment: ["Jihoz", "Инвентарь"],
  alternatives: ["Muqobil mashqlar", "Альтернативы"],
  record: ["Rekord", "Рекорд"],
  locked_ex: ["Texnika va xatolar tahlili — Premium’da", "Техника и разбор ошибок — в Premium"],
  recommended: ["Siz uchun", "Для Вас"],
  program_start: ["Dasturni boshlash", "Начать программу"],
  program_active: ["Joriy dastur", "Текущая программа"],
  program_week1: ["Bepul koʻrish: 1-hafta", "Бесплатный просмотр: 1-я неделя"],
  per_session: ["mashgʻulot", "тренировка"],
  goal: ["Maqsad", "Цель"],
  place: ["Joy", "Место"],

  // player
  workout: ["Mashgʻulot", "Тренировка"],
  set: ["Yondashuv", "Подход"],
  of: ["dan", "из"],
  done_set: ["Yondashuv bajarildi", "Подход выполнен"],
  rest: ["Dam olish", "Отдых"],
  skip_rest: ["Oʻtkazib yuborish", "Пропустить"],
  next_ex: ["Keyingi", "Следующее"],
  finish: ["Yakunlash", "Завершить"],
  finish_q: ["Mashgʻulotni yakunlaysizmi?", "Завершить тренировку?"],
  weight_kg: ["Vazn, kg", "Вес, кг"],
  reps_done: ["Takrorlar", "Повторы"],
  time_hold: ["Vaqt", "Время"],
  start_timer: ["Taymerni boshlash", "Запустить таймер"],
  pause: ["Pauza", "Пауза"],
  bodyweight: ["oʻz vazningiz bilan", "свой вес"],
  well_done: ["Zoʻr ish!", "Отличная работа!"],
  duration: ["Davomiylik", "Длительность"],
  volume: ["Hajm", "Объём"],
  burned: ["Sarflandi", "Сожжено"],
  new_pr: ["Yangi rekord!", "Новый рекорд!"],
  xp: ["XP", "XP"],
  to_home: ["Bosh sahifaga", "На главную"],
  rate: ["Mashgʻulot qanday oʻtdi?", "Как прошла тренировка?"],
  quick_workout: ["Erkin mashgʻulot", "Свободная тренировка"],

  // food
  food_diary: ["Ovqat kundaligi", "Дневник питания"],
  search_food: ["Osh, somsa, tuxum…", "Плов, самса, яйцо…"],
  breakfast: ["Nonushta", "Завтрак"],
  lunch: ["Tushlik", "Обед"],
  dinner: ["Kechki ovqat", "Ужин"],
  snack: ["Gazak", "Перекус"],
  add: ["Qoʻshish", "Добавить"],
  portion: ["Porsiya", "Порция"],
  qty: ["Miqdor", "Количество"],
  food_locked: ["Ovqat kundaligi — Premium imkoniyati", "Дневник питания — функция Premium"],
  food_locked_d: ["Bepul versiyada kunlik meʼyoringiz va suv hisobi mavjud", "В бесплатной версии доступны Ваша норма и учёт воды"],
  empty_meal: ["Hali hech narsa yoʻq", "Пока пусто"],

  // progress
  weight_trend: ["Vazn dinamikasi", "Динамика веса"],
  add_measure: ["Oʻlchov qoʻshish", "Добавить замер"],
  waist: ["Bel", "Талия"],
  records: ["Shaxsiy rekordlar", "Личные рекорды"],
  achievements: ["Yutuqlar", "Достижения"],
  workouts_n: ["Mashgʻulotlar", "Тренировок"],
  this_month: ["shu oy", "за месяц"],
  no_data: ["Hali maʼlumot yoʻq", "Пока нет данных"],
  history: ["Tarix", "История"],

  // profile
  my_plan: ["Mening rejam", "Мой план"],
  edit_profile: ["Anketani oʻzgartirish", "Изменить анкету"],
  language: ["Til", "Язык"],
  reminders: ["Eslatmalar", "Напоминания"],
  invite: ["Doʻstni taklif qilish", "Пригласить друга"],
  invite_d: ["Doʻstingiz qoʻshilsa — ikkalangizga bonus", "Друг присоединится — бонус обоим"],
  squads: ["Otryadlar", "Отряды"],
  squad_create: ["Otryad tuzish", "Создать отряд"],
  squad_name: ["Otryad nomi", "Название отряда"],
  squad_board: ["Haftalik reyting", "Рейтинг недели"],
  promo: ["Promokod", "Промокод"],
  promo_apply: ["Faollashtirish", "Активировать"],
  support: ["Yordam", "Поддержка"],
  premium_until: ["Premium faol:", "Premium активен до"],
  get_premium: ["Premium’ga oʻtish", "Подключить Premium"],

  // paywall
  pw_title: ["SPARTA Premium", "SPARTA Premium"],
  pw_sub: ["Natija uchun hamma narsa — bir obunada", "Всё для результата — в одной подписке"],
  pw_f1: ["Barcha dasturlar: uy, hovli, zal, ozish, massa", "Все программы: дом, двор, зал, похудение, масса"],
  pw_f2: ["Har bir mashq texnikasi va xatolar tahlili", "Техника и разбор ошибок каждого упражнения"],
  pw_f3: ["Oʻzbek taomlari bilan ovqat kundaligi", "Дневник питания с узбекской кухней"],
  pw_f4: ["Ramazon va «Toʻy» rejimlari", "Режимы Рамадан и «Той»"],
  pw_f5: ["Yopiq challenjlar va 3 tagacha otryad", "Закрытые челленджи и до 3 отрядов"],
  pw_month: ["1 oy", "1 месяц"],
  pw_year: ["1 yil", "1 год"],
  pw_save: ["−33%", "−33%"],
  pw_per_month: ["oyiga", "в месяц"],
  pw_trial: ["3 kun bepul sinash", "3 дня бесплатно"],
  pw_buy: ["Telegram Stars bilan toʻlash", "Оплатить Telegram Stars"],
  pw_note: ["Obunani istalgan vaqtda Telegram sozlamalarida bekor qilish mumkin", "Подписку можно отменить в любой момент в настройках Telegram"],
  pw_ok: ["Premium faollashtirildi! 🛡", "Premium активирован! 🛡"],
  pw_trial_ok: ["3 kunlik sinov boshlandi", "Пробный период на 3 дня начался"],

  // ranks
  rank_0: ["Yangi askar", "Новобранец"],
  rank_1: ["Jangchi", "Воин"],
  rank_2: ["Veteran", "Ветеран"],
  rank_3: ["Chempion", "Чемпион"],
  rank_4: ["Afsona", "Легенда"],
} satisfies Record<string, [string, string]>;

export type Key = keyof typeof D;

let lang: Lang = (() => {
  try {
    const s = localStorage.getItem("sp_lang");
    if (s === "uz" || s === "ru") return s;
  } catch { /* ignore */ }
  const tl = (globalThis as any).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  return tl === "ru" ? "ru" : "uz";
})();
const subs = new Set<() => void>();

export function getLang() {
  return lang;
}
export function setLang(l: Lang) {
  lang = l;
  try {
    localStorage.setItem("sp_lang", l);
  } catch { /* ignore */ }
  document.documentElement.lang = l;
  subs.forEach((f) => f());
}
export function t(k: Key): string {
  return D[k][lang === "uz" ? 0 : 1];
}
/** Picks name_uz/name_ru (or title_*, steps_* …) from a row. */
export function L<T = string>(row: any, base: string): T {
  return row?.[`${base}_${lang}`] ?? row?.[`${base}_uz`] ?? row?.[`${base}_ru`];
}
export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => lang,
  );
}
export const fmt = (n: number) => Math.round(n).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ").replace(/,/g, " ");

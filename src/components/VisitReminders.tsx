import { Link } from "@tanstack/react-router";
import { BellRing, CalendarDays, Check, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { attendanceSchedule, type Visit } from "@/lib/visits";
import { downloadVisitCalendar } from "@/lib/calendar";
import { Button, Card } from "./ui-kit";

export function VisitReminders({ visit }: { visit?: Visit | undefined }) {
  const { copy, state, updateSettings, previewVisitReminder, confirmVisit, cancelVisit } =
    useStore();
  const [preview, setPreview] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [message, setMessage] = useState("");
  const active = visit?.status === "booked";
  return (
    <Card className="reminders-card">
      <div className="reminders-heading">
        <span className="clinic-symbol">
          <BellRing size={24} />
        </span>
        <div>
          <h2>{copy("Чтобы не пропустить скрининг", "Скринингті өткізіп алмау үшін")}</h2>
          <p>
            {copy(
              "Напомним заранее. Если планы изменятся — легко выбрать другое время.",
              "Алдын ала еске саламыз. Жоспар өзгерсе, басқа уақытты оңай таңдауға болады.",
            )}
          </p>
        </div>
      </div>
      <div className="reminder-stages">
        {[72, 24, 2].map((hours) => {
          const item = visit
            ? attendanceSchedule(visit).find((item) => item.hours === hours)
            : null;
          const passed = item && item.at < (visit!.scheduledAt ?? visit!.createdAt);
          const sent = item && visit?.attendanceReminded?.includes(item.key);
          return (
            <div key={hours}>
              <b>
                {hours} {copy("ч", "сағ")}
              </b>
              <span>{copy("до визита", "қабылдауға дейін")}</span>
              <small>
                {sent
                  ? copy("В приложении показано", "Қолданбада көрсетілді")
                  : passed
                    ? copy("Запись создана позже", "Кейінірек жазылдыңыз")
                    : item
                      ? new Date(item.at).toLocaleString(state.lang === "kk" ? "kk-KZ" : "ru-RU", {
                          timeZone: "Asia/Qyzylorda",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : copy("Подготовка и подтверждение", "Дайындық пен растау")}
              </small>
            </div>
          );
        })}
      </div>
      <label className="reminder-toggle">
        <input
          type="checkbox"
          checked={state.settings.reminders}
          onChange={(e) => updateSettings({ reminders: e.target.checked })}
        />
        <span>{copy("Напоминания внутри приложения", "Қолданба ішіндегі еске салулар")}</span>
      </label>
      <p className="reminder-explanation">
        {copy(
          "На сайте напоминания появляются, пока он открыт. Добавьте визит в календарь телефона, чтобы получать сигналы и после закрытия сайта. Разрешите уведомления в календаре; их показ зависит от настроек телефона.",
          "Сайттағы еске салулар ол ашық болғанда пайда болады. Сайт жабылғанда да белгі алу үшін қабылдауды телефон күнтізбесіне қосыңыз. Күнтізбеге хабарлама көрсетуге рұқсат беріңіз; көрсетілуі телефон баптауларына байланысты.",
        )}
      </p>
      {active && (
        <div className="reminder-buttons">
          <Button
            variant="secondary"
            onClick={() => {
              try {
                downloadVisitCalendar(visit, state.lang, 10);
                setMessage(
                  copy(
                    "Откройте скачанный файл и добавьте событие в календарь.",
                    "Жүктелген файлды ашып, оқиғаны күнтізбеге қосыңыз.",
                  ),
                );
              } catch {
                setMessage(
                  copy("Не удалось скачать. Попробуйте ещё раз.", "Жүктелмеді. Қайталап көріңіз."),
                );
              }
            }}
          >
            <CalendarDays size={18} />
            {copy("В календарь телефона", "Телефон күнтізбесіне")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              previewVisitReminder(visit.id);
              setPreview(true);
            }}
          >
            <MessageSquare size={18} />
            {copy("Показать напоминание", "Еске салуды көрсету")}
          </Button>
        </div>
      )}
      {!visit && (
        <Link to="/book" className="muted-link">
          {copy("Записаться и настроить напоминания →", "Жазылып, еске салуларды баптау →")}
        </Link>
      )}
      {message && (
        <p role="status" className="reminder-explanation">
          {message}
        </p>
      )}
      {preview && active && (
        <div className="reminder-message" role="status">
          <span>
            {copy(
              "Пример сообщения · сохранено в уведомлениях",
              "Хабарлама үлгісі · хабарламаларда сақталды",
            )}
          </span>
          <h3>SmartQ · {copy("Ждём вас на скрининге", "Сізді скринингке күтеміз")}</h3>
          <p>
            {copy(
              `${visit.date} в ${visit.time}. Пожалуйста, приходите. Подтвердите визит или измените запись, если планы поменялись.`,
              `${visit.date}, ${visit.time}. Қабылдауға келуіңізді сұраймыз. Келетініңізді растаңыз немесе жоспарыңыз өзгерсе, уақытты ауыстырыңыз.`,
            )}
          </p>
          <div className="reminder-response-buttons">
            <button disabled={!!visit.confirmedAt} onClick={() => confirmVisit(visit.id)}>
              <Check size={16} />
              {visit.confirmedAt
                ? copy("Подтверждено", "Расталды")
                : copy("Я приду", "Мен келемін")}
            </button>
            <Link to="/book" search={{ edit: visit.id }}>
              {copy("Перенести", "Уақытты ауыстыру")}
            </Link>
            <button onClick={() => setCancel(true)}>{copy("Отменить", "Тоқтату")}</button>
          </div>
          {cancel && (
            <div className="mt-4">
              <p>
                {copy(
                  "Отменить визит и освободить время?",
                  "Қабылдауды тоқтатып, уақытты босату керек пе?",
                )}
              </p>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  cancelVisit(visit.id);
                  setCancel(false);
                  setPreview(false);
                }}
              >
                {copy("Да, отменить", "Иә, тоқтату")}
              </Button>
              <button className="ml-4" onClick={() => setCancel(false)}>
                {copy("Оставить запись", "Жазылуды сақтау")}
              </button>
            </div>
          )}
        </div>
      )}
      <div className="reminder-channels">
        <MessageSquare size={18} />
        <p>
          {copy(
            "SMS, WhatsApp и Telegram — следующий шаг. В этом прототипе внешняя отправка ещё не подключена; пример выше показывает, как будет выглядеть напоминание.",
            "SMS, WhatsApp және Telegram — келесі қадам. Бұл прототипте сыртқы хабарлама жіберу әлі қосылмаған; жоғарыдағы үлгі еске салудың көрінісін көрсетеді.",
          )}
        </p>
      </div>
      <Link to="/screening" className="muted-link">
        {copy("О скрининге без тревоги →", "Скрининг туралы алаңдамай білу →")}
      </Link>
    </Card>
  );
}

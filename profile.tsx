import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Download,
  Languages,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { Screen, Card, Button, Toggle, DemoTag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
export const Route = createFileRoute("/profile")({ component: Profile });
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
function Profile() {
  const { state, copy, setLang, setDisplayName, updateSettings, resetAll, hydrated } = useStore();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [permission, setPermission] = useState("");
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if (hydrated) setName(state.displayName);
  }, [hydrated, state.displayName]);
  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setInstall(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  async function setPush(value: boolean) {
    if (!value) {
      updateSettings({ push: false });
      return;
    }
    if (!("Notification" in window)) {
      setPermission(
        copy(
          "Этот браузер не поддерживает уведомления устройства.",
          "Бұл браузер құрылғы хабарламаларын қолдамайды.",
        ),
      );
      return;
    }
    try {
      const result = await Notification.requestPermission();
      updateSettings({ push: result === "granted" });
      setPermission(
        result === "granted"
          ? copy("Разрешение получено.", "Рұқсат алынды.")
          : copy(
              "Разрешите уведомления в настройках браузера.",
              "Браузер баптауларында хабарламаларға рұқсат беріңіз.",
            ),
      );
    } catch {
      setPermission(copy("Не удалось запросить разрешение.", "Рұқсат сұрау мүмкін болмады."));
    }
  }
  return (
    <Screen
      title={copy("Мой профиль", "Менің профилім")}
      subtitle={copy(
        "Ваше пространство и настройки приложения.",
        "Сіздің кеңістігіңіз және қолданба баптаулары.",
      )}
      right={<DemoTag />}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex gap-3 items-center mb-5">
              <span className="avatar !w-12 !h-12">
                <User size={23} />
              </span>
              <div>
                <h2 className="font-semibold">
                  {state.displayName || copy("Гость SmartQ", "SmartQ қонағы")}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {copy("Демонстрационный профиль", "Демонстрациялық профиль")}
                </p>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDisplayName(name);
                setSaved(true);
              }}
            >
              <label className="field" htmlFor="display-name">
                {copy("Как к вам обращаться", "Сізге қалай жүгінуге болады")}
                <input
                  id="display-name"
                  maxLength={40}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                  placeholder={copy("Ваше имя или псевдоним", "Атыңыз немесе бүркеншік атыңыз")}
                />
                <span className="field-help">
                  {copy(
                    "Необязательно. Сохраняется только в этом браузере.",
                    "Міндетті емес. Тек осы браузерде сақталады.",
                  )}
                </span>
              </label>
              <Button type="submit" variant="secondary" size="md" className="mt-4">
                {saved ? copy("Сохранено", "Сақталды") : copy("Сохранить", "Сақтау")}
              </Button>
            </form>
          </Card>
          <Card className="p-6">
            <h2 className="flex gap-2 text-sm font-semibold mb-5">
              <Languages size={18} className="text-primary" />
              {copy("Язык приложения", "Қолданба тілі")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={state.lang === "ru" ? "primary" : "outline"}
                onClick={() => setLang("ru")}
              >
                Русский
              </Button>
              <Button
                variant={state.lang === "kk" ? "primary" : "outline"}
                onClick={() => setLang("kk")}
              >
                Қазақша
              </Button>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="flex gap-2 text-sm font-semibold mb-5">
              <Bell size={18} className="text-primary" />
              {copy("Уведомления", "Хабарламалар")}
            </h2>
            <div className="flex gap-4 items-center justify-between">
              <div>
                <p className="text-sm">{copy("События очереди", "Кезек оқиғалары")}</p>
                <p className="field-help mt-1">
                  {copy(
                    "Приближение очереди и вызов кабинета",
                    "Кезектің жақындауы және кабинетке шақыру",
                  )}
                </p>
              </div>
              <Toggle
                checked={state.settings.queueEvents}
                onChange={(queueEvents) => updateSettings({ queueEvents })}
                label={copy("События очереди", "Кезек оқиғалары")}
              />
            </div>
            <div className="flex gap-4 items-center justify-between mt-5 pt-5 border-t">
              <div>
                <p className="text-sm">{copy("Уведомления устройства", "Құрылғы хабарламалары")}</p>
                <p className="field-help mt-1">
                  {copy(
                    "В этой версии — пока приложение открыто",
                    "Бұл нұсқада — қолданба ашық кезде",
                  )}
                </p>
              </div>
              <Toggle
                checked={state.settings.push}
                onChange={setPush}
                label={copy("Уведомления устройства", "Құрылғы хабарламалары")}
              />
            </div>
            <div className="flex gap-4 items-center justify-between mt-5 pt-5 border-t">
              <div>
                <p className="text-sm">
                  {copy("Напоминание о приёме", "Қабылдау туралы еске салу")}
                </p>
                <p className="field-help mt-1">
                  {copy(
                    "Появится на активной вкладке приложения.",
                    "Қолданбаның белсенді қойындысында көрсетіледі.",
                  )}
                </p>
              </div>
              <Toggle
                checked={state.settings.reminders}
                onChange={(reminders) => updateSettings({ reminders })}
                label={copy("Напоминание о приёме", "Қабылдау туралы еске салу")}
              />
            </div>
            {state.settings.reminders && (
              <label className="field mt-4">
                {copy("Напомнить заранее", "Алдын ала еске салу")}
                <select
                  value={state.settings.remindBefore}
                  onChange={(e) =>
                    updateSettings({ remindBefore: Number(e.target.value) as 5 | 10 | 15 })
                  }
                >
                  {[5, 10, 15].map((n) => (
                    <option key={n} value={n}>
                      {copy(`За ${n} минут`, `${n} минут бұрын`)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {permission && (
              <p className="field-help mt-4" role="status">
                {permission}
              </p>
            )}
            <Link to="/notifications" className="muted-link mt-5">
              {copy("Открыть уведомления", "Хабарламаларды ашу")}
              <ArrowRight size={15} />
            </Link>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-6">
            <span className="clinic-symbol">
              <Download size={22} />
            </span>
            <h2 className="font-semibold mt-4">
              {copy("SmartQ под рукой", "SmartQ әрдайым қолыңызда")}
            </h2>
            <p className="text-xs text-muted-foreground mt-2 leading-6">
              {installed
                ? copy("Приложение запущено с главного экрана.", "Қолданба басты экраннан ашылды.")
                : copy(
                    "Добавьте приложение на главный экран телефона. Оно будет открываться в отдельном окне.",
                    "Қолданбаны телефонның басты экранына қосыңыз. Ол бөлек терезеде ашылады.",
                  )}
            </p>
            {install && !installed ? (
              <Button
                className="mt-4"
                onClick={async () => {
                  await install.prompt();
                  await install.userChoice;
                  setInstall(null);
                }}
              >
                <Download size={17} />
                {copy("Установить приложение", "Қолданбаны орнату")}
              </Button>
            ) : (
              !installed && (
                <p className="demo-note mt-4">
                  {copy(
                    "Откройте меню браузера → «Установить приложение» или «На экран Домой». Возможность зависит от браузера.",
                    "Браузер мәзірі → «Қолданбаны орнату» немесе «Басты экранға қосу». Мүмкіндік браузерге байланысты.",
                  )}
                </p>
              )
            )}
          </Card>
          <Card className="p-6">
            <h2 className="flex gap-2 text-sm font-semibold">
              <ShieldCheck size={18} className="text-primary" />
              {copy("О данных и доступе", "Деректер мен қолжетімділік туралы")}
            </h2>
            <p className="text-xs text-muted-foreground mt-4 leading-6">
              {copy(
                "SmartQ — рабочая демонстрация сервиса. Записи, талон, имя и настройки хранятся локально. Это не подтверждённый аккаунт пациента. Интеграция с клиниками и обмен между устройствами пока не подключены.",
                "SmartQ — сервистің жұмыс демонстрациясы. Жазылулар, талон, ат пен баптаулар жергілікті сақталады. Бұл расталған пациент аккаунты емес. Клиникалармен интеграция және құрылғылар арасындағы алмасу әлі қосылмаған.",
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-3 leading-6">
              {copy(
                "Для карты браузер обращается к OpenStreetMap. Внешний шрифт загружается с Google Fonts.",
                "Карта үшін браузер OpenStreetMap сервисіне жүгінеді. Сыртқы қаріп Google Fonts арқылы жүктеледі.",
              )}
            </p>
            <Button
              variant="danger"
              size="md"
              className="mt-5"
              onClick={() => {
                if (
                  window.confirm(
                    copy(
                      "Удалить все местные записи, историю и настройки?",
                      "Барлық жергілікті жазылуларды, тарих пен баптауларды өшіру керек пе?",
                    ),
                  )
                ) {
                  resetAll();
                  setName("");
                  setSaved(false);
                }
              }}
            >
              {copy("Удалить данные этого браузера", "Осы браузердегі деректерді өшіру")}
            </Button>
          </Card>
          <Link to="/staff" className="side-link bg-white border">
            <Stethoscope size={20} />
            {copy("Рабочее место сотрудника", "Қызметкердің жұмыс орны")}
            <ArrowRight size={16} className="ml-auto" />
          </Link>
          <Link to="/analytics" className="muted-link px-2">
            {copy("Аналитика и показатели", "Аналитика және көрсеткіштер")}
            <ArrowRight size={15} />
          </Link>
          <p className="text-[10px] text-muted-foreground px-2">SmartQ Health · 2.1</p>
        </div>
      </div>
    </Screen>
  );
}

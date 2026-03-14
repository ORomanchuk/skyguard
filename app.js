const UAV_TYPES = {
"Sting": { c4: 500 },
"P1-SUN": { c4: 500 },
"AS3-IR Merops": { autoWarhead: "КУФ-1,2" },
"Shulika": { c4: 1200 },
"Багнет-АА": { c4: 250 }
}

const UAV_MODES = ["Д", "Н", "Д/Н"]
const DETONATORS = ["ЕДП", "ЕДПР", "ЕД-8-Ж"]
const COMBAT_FLIGHT_RESULTS = ["Борт повернуто", "Борт втрачено", "Борт підірвано"]
const TRAINING_FLIGHT_RESULTS = ["Борт повернуто", "Борт втрачено"]
const BATTLE_RESULTS = ["Ціль знищено", "Ціль не знищено"]
const BASE_REASON_OPTIONS = [
"Ціль візуально не виявлено",
"Був візуальний контакт",
"Ціль вийшла з зони ураження",
"Ціль локаційно втрачено",
"Ціль знищено суміжними підрозділами",
"Технічна несправність борта"
]
const SKIP_SPLASH_KEY = "skyguard-skip-splash"
const SETTINGS_STORAGE_KEY = "skyguard-settings-v2"
const LEGACY_FORM_STORAGE_KEY = "skyguard-form"
const LEGACY_UNIT_STORAGE_KEY = "skyguard-unit"
const LEGACY_CREW_STORAGE_KEY = "skyguard-crew"
const LEGACY_TOWN_STORAGE_KEY = "skyguard-town"
const LEGACY_SERIAL_STORAGE_KEY = "skyguard-serial"
const LEGACY_UAV_STORAGE_KEY = "skyguard-uav-config"

const REASON_OPTIONS = {
"Борт повернуто": BASE_REASON_OPTIONS,
"Борт втрачено": [...BASE_REASON_OPTIONS, "Не вистачило батареї на повернення"],
"Борт підірвано": [...BASE_REASON_OPTIONS, "Не вистачило батареї на повернення"]
}

const el = {
unit: document.getElementById("unit"),
crew: document.getElementById("crew"),
town: document.getElementById("town"),
serial: document.getElementById("serial"),
target: document.getElementById("target"),
azimuth: document.getElementById("azimuth"),
course: document.getElementById("course"),
distance: document.getElementById("distance"),
height: document.getElementById("height"),
takeoff: document.getElementById("takeoff"),
endTime: document.getElementById("endTime"),
report: document.getElementById("reportPreview"),
reportBlock: document.getElementById("reportBlock"),
logBlock: document.getElementById("logBlock"),
afterTakeoff: document.getElementById("afterTakeoff"),
combatFields: document.getElementById("combatFields"),
preTakeoffFields: document.getElementById("preTakeoffFields"),
targetType: document.getElementById("targetType"),
targetTypeBlock: document.getElementById("targetTypeBlock"),
noTaskTargetBtn: document.getElementById("noTaskTargetBtn"),
trainingToggle: document.getElementById("trainingToggle"),
uavSelectBtn: document.getElementById("uavSelectBtn"),
uavMenu: document.getElementById("uavMenu"),
uavTypeOptions: document.getElementById("uavTypeOptions"),
uavModeOptions: document.getElementById("uavModeOptions"),
detonatorBlock: document.getElementById("detonatorBlock"),
detonatorOptions: document.getElementById("detonatorOptions"),
uavModalSummary: document.getElementById("uavModalSummary"),
uavConfirmBtn: document.getElementById("uavConfirmBtn"),
uavCancelBtn: document.getElementById("uavCancelBtn"),
combatOutcomeBlock: document.getElementById("combatOutcomeBlock"),
battleResults: document.getElementById("battleResults"),
flightOutcomeBlock: document.getElementById("flightOutcomeBlock"),
flightResults: document.getElementById("flightResults"),
trainingOutcomeBlock: document.getElementById("trainingOutcomeBlock"),
trainingResults: document.getElementById("trainingResults"),
reasonBlock: document.getElementById("reasonBlock"),
reasonOptions: document.getElementById("reasonOptions"),
destroyCoords: document.getElementById("destroyCoords"),
az2: document.getElementById("az2"),
dist2: document.getElementById("dist2"),
h2: document.getElementById("h2"),
sendMenu: document.getElementById("sendMenu"),
sendReportBtn: document.getElementById("sendReportBtn"),
sendCancelBtn: document.getElementById("sendCancelBtn"),
uavClearBtn: document.getElementById("uavClearBtn"),
sendWhatsBtn: document.getElementById("sendWhatsBtn"),
sendDiscBtn: document.getElementById("sendDiscBtn")
}

let trainingMode = false
let hasTakenOff = false
let battleResult = ""
let flightResult = ""
let selectedReasons = []
let uavConfig = {
name: "",
mode: "",
detonator: "",
autoWarhead: "",
c4: ""
}
let modalSelection = {
name: "",
mode: "",
detonator: ""
}

function hideSplash(immediate = false) {
const splash = document.getElementById("splash")
if (!splash || splash.dataset.closed === "true") return
splash.dataset.closed = "true"
if (immediate) {
splash.style.display = "none"
return
}
splash.style.opacity = "0"
splash.style.pointerEvents = "none"
setTimeout(() => {
splash.style.display = "none"
}, 600)
}

function prepareReload(skipSplash = true) {
if (skipSplash) {
sessionStorage.setItem(SKIP_SPLASH_KEY, "1")
} else {
sessionStorage.removeItem(SKIP_SPLASH_KEY)
}
window.location.reload()
}

const skipSplash = sessionStorage.getItem(SKIP_SPLASH_KEY) === "1"
sessionStorage.removeItem(SKIP_SPLASH_KEY)
if (skipSplash) {
hideSplash(true)
} else {
setTimeout(() => hideSplash(), 1200)
}

function currentTime() {
return new Date().toLocaleTimeString("uk-UA", {
hour: "2-digit",
minute: "2-digit"
})
}

function showWhen(element, visible) {
element.classList.toggle("hidden", !visible)
}
function syncTrainingTarget() {
if (trainingMode) {
el.target.value = "Тренувальний політ"
el.target.readOnly = true
} else {
if (el.target.value === "Тренувальний політ") {
el.target.value = ""
}
el.target.readOnly = false
}
}

function finishLabel() {
if (trainingMode) {
return flightResult === "Борт втрачено" ? "Час втрати борта" : "Час посадки"
}
if (battleResult === "Ціль знищено") {
return "Час знищення цілі"
}
if (flightResult === "Борт втрачено") {
return "Час втрати борта"
}
if (flightResult === "Борт підірвано") {
return "Час підриву борта"
}
return "Час посадки"
}

function formatResultLine() {
const parts = []
if (selectedReasons.length) {
parts.push(selectedReasons.join(", "))
}
if (flightResult) {
parts.push(flightResult)
}
return parts.join(", ")
}

async function copy(text) {
try {
await navigator.clipboard.writeText(text)
toast()
} catch {
alert("Не вдалося скопіювати текст до буфера обміну.")
}
}

function toast() {
const toastEl = document.getElementById("toast")
toastEl.style.display = "block"
setTimeout(() => {
toastEl.style.display = "none"
}, 2000)
}

let saveToastTimer = null

function showSaveToast() {
const saveToastEl = document.getElementById("saveToast")
saveToastEl.style.display = "block"
clearTimeout(saveToastTimer)
saveToastTimer = setTimeout(() => {
saveToastEl.style.display = "none"
}, 1400)
}

function emptyUavConfig() {
return {
name: "",
mode: "",
detonator: "",
autoWarhead: "",
c4: ""
}
}

function sanitizeUavConfig(value) {
if (!value || typeof value !== "object" || typeof value.name !== "string") {
return emptyUavConfig()
}

return {
name: value.name || "",
mode: value.mode || "",
detonator: value.detonator || "",
autoWarhead: value.autoWarhead || "",
c4: value.c4 || ""
}
}

function normalizePersistedSettings(value) {
const payload = value && typeof value === "object" ? value : {}
return {
unit: typeof payload.unit === "string" ? payload.unit : "",
crew: typeof payload.crew === "string" ? payload.crew : "",
town: typeof payload.town === "string" ? payload.town : "",
serial: typeof payload.serial === "string" ? payload.serial : "",
uavConfig: sanitizeUavConfig(payload.uavConfig)
}
}

function readLegacySettings() {
let legacyFormSettings = normalizePersistedSettings(null)
try {
legacyFormSettings = normalizePersistedSettings(JSON.parse(localStorage.getItem(LEGACY_FORM_STORAGE_KEY) || "{}"))
} catch {
localStorage.removeItem(LEGACY_FORM_STORAGE_KEY)
}

let legacyUavConfig = emptyUavConfig()
try {
legacyUavConfig = sanitizeUavConfig(JSON.parse(localStorage.getItem(LEGACY_UAV_STORAGE_KEY) || "null"))
} catch {
localStorage.removeItem(LEGACY_UAV_STORAGE_KEY)
}

return normalizePersistedSettings({
unit: localStorage.getItem(LEGACY_UNIT_STORAGE_KEY) || legacyFormSettings.unit,
crew: localStorage.getItem(LEGACY_CREW_STORAGE_KEY) || legacyFormSettings.crew,
town: localStorage.getItem(LEGACY_TOWN_STORAGE_KEY) || legacyFormSettings.town,
serial: localStorage.getItem(LEGACY_SERIAL_STORAGE_KEY) || legacyFormSettings.serial,
uavConfig: legacyUavConfig.name ? legacyUavConfig : legacyFormSettings.uavConfig
})
}

function readPersistedSettings() {
try {
const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
if (raw) {
return normalizePersistedSettings(JSON.parse(raw))
}
} catch {
localStorage.removeItem(SETTINGS_STORAGE_KEY)
}

const legacySettings = readLegacySettings()
if (legacySettings.unit || legacySettings.crew || legacySettings.town || legacySettings.serial || legacySettings.uavConfig.name) {
writePersistedSettings(legacySettings)
}
return legacySettings
}

function writePersistedSettings(settings) {
const normalized = normalizePersistedSettings(settings)
localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized))
localStorage.setItem(LEGACY_FORM_STORAGE_KEY, JSON.stringify(normalized))
}

function getCurrentPersistedSettings() {
return {
unit: el.unit.value,
crew: el.crew.value,
town: el.town.value,
serial: el.serial.value,
uavConfig: sanitizeUavConfig(uavConfig)
}
}

let isHydratingSettings = false

function persistSettings(showToastIndicator = true) {
writePersistedSettings(getCurrentPersistedSettings())
if (showToastIndicator && !isHydratingSettings) {
showSaveToast()
}
}

function applyFieldValue(input, value) {
input.value = value
input.defaultValue = value
input.setAttribute("value", value)
}

function loadFromLocalStorage() {
const settings = readPersistedSettings()
isHydratingSettings = true
applyFieldValue(el.unit, settings.unit)
applyFieldValue(el.crew, settings.crew)
applyFieldValue(el.town, settings.town)
applyFieldValue(el.serial, settings.serial)
uavConfig = settings.uavConfig.name ? settings.uavConfig : emptyUavConfig()
updateUavButton()
renderFlightLog()
showWhen(el.logBlock, true)
isHydratingSettings = false
}

function targetLabel() {
const value = el.target.value.trim()
if (!value) return "Без видачі"
if (value === "Тренувальний політ") return value
const number = parseInt(value, 10)
if (!Number.isNaN(number)) {
if (number >= 1 && number <= 6999) return `${value} (Skymap)`
if (number >= 7000 && number <= 9999) return `${value} (Віраж)`
}
return value
}

function fullTargetLabel() {
const base = targetLabel()
const targetType = el.targetType.value.trim()
return targetType ? `${targetType} ${base}` : base
}

function formatUavLine() {
if (!uavConfig.name) return "БПЛА: не обрано"
return `БПЛА: «${uavConfig.name}» (${uavConfig.mode}) № ${el.serial.value}`
}

function formatWarheadUsage() {
if (!uavConfig.name) return ""
if (uavConfig.autoWarhead) {
return `Витрата БЧ: ${uavConfig.autoWarhead} - 1 шт.`
}
return `Витрата БЧ: ${uavConfig.detonator} - 1 шт., C4 - ${uavConfig.c4}гр.`
}

function updateUavButton() {
if (!uavConfig.name) {
el.uavSelectBtn.textContent = "Обрати БПЛА"
return
}
const payloadText = uavConfig.autoWarhead
? uavConfig.autoWarhead
: `${uavConfig.detonator}, C4 ${uavConfig.c4}гр.`
el.uavSelectBtn.textContent = `${uavConfig.name} (${uavConfig.mode}) • ${payloadText}`
}

function openUavModal() {
modalSelection = {
name: uavConfig.name,
mode: uavConfig.mode,
detonator: uavConfig.detonator
}
renderUavModal()
el.uavMenu.style.display = "flex"
}

function closeUavModal() {
el.uavMenu.style.display = "none"
}

function renderChoiceButtons(container, items, currentValue, onPick) {
container.innerHTML = ""
if (currentValue) {
const activeButton = document.createElement("button")
activeButton.type = "button"
activeButton.className = "choiceBtn active"
activeButton.textContent = currentValue
activeButton.onclick = () => onPick("")
container.appendChild(activeButton)
return
}
items.forEach(item => {
const button = document.createElement("button")
button.type = "button"
button.className = "choiceBtn"
button.textContent = item
button.onclick = () => onPick(item)
container.appendChild(button)
})
}

function renderExclusiveResultButtons(container, items, activeValue, onPick) {
container.innerHTML = ""
if (activeValue) {
const activeButton = document.createElement("button")
activeButton.type = "button"
activeButton.className = "resultBtn active"
activeButton.textContent = activeValue
activeButton.onclick = () => onPick("")
container.appendChild(activeButton)
return
}
items.forEach(item => {
const button = document.createElement("button")
button.type = "button"
button.className = "resultBtn"
button.textContent = item
button.onclick = () => onPick(item)
container.appendChild(button)
})
}

function renderUavModal() {
renderChoiceButtons(el.uavTypeOptions, Object.keys(UAV_TYPES), modalSelection.name, value => {
modalSelection.name = value
if (UAV_TYPES[value].autoWarhead) {
modalSelection.detonator = ""
}
renderUavModal()
})
renderChoiceButtons(el.uavModeOptions, UAV_MODES, modalSelection.mode, value => {
modalSelection.mode = value
renderUavModal()
})
const currentType = UAV_TYPES[modalSelection.name]
const needsDetonator = currentType && !currentType.autoWarhead
showWhen(el.detonatorBlock, Boolean(needsDetonator))
if (needsDetonator) {
renderChoiceButtons(el.detonatorOptions, DETONATORS, modalSelection.detonator, value => {
modalSelection.detonator = value
renderUavModal()
})
el.uavModalSummary.textContent = modalSelection.name
? `С4 буде встановлено автоматично: ${currentType.c4}гр.`
: ""
} else if (currentType && currentType.autoWarhead) {
el.uavModalSummary.textContent = `БЧ буде встановлено автоматично: ${currentType.autoWarhead}`
el.detonatorOptions.innerHTML = ""
} else {
el.uavModalSummary.textContent = "Оберіть тип БПЛА та режим"
el.detonatorOptions.innerHTML = ""
}
el.uavConfirmBtn.disabled = !canConfirmUav()
}

function canConfirmUav() {
if (!modalSelection.name || !modalSelection.mode) return false
const currentType = UAV_TYPES[modalSelection.name]
if (!currentType) return false
if (currentType.autoWarhead) return true
return Boolean(modalSelection.detonator)
}

function clearUavSelection() {
  modalSelection = {
    name: "",
    mode: "",
    detonator: ""
  }
  renderUavModal()
}

function confirmUavSelection() {
if (!canConfirmUav()) return
const currentType = UAV_TYPES[modalSelection.name]
uavConfig = {
name: modalSelection.name,
mode: modalSelection.mode,
detonator: currentType.autoWarhead ? "" : modalSelection.detonator,
autoWarhead: currentType.autoWarhead || "",
c4: currentType.c4 || ""
}
closeUavModal()
updateUavButton()
persistSettings()
updatePreview()
}

function setValue(field, value) {
const input = document.getElementById(field)
if (input) {
input.value = value
updatePreview()
}
}

function setTargetType(value) {
el.targetType.value = value
updatePreview()
}

function setNoAssignmentTarget() {
if (trainingMode) return
el.target.value = "Ціль без видачі"
updatePreview()
}

function autoTakeoff() {
el.takeoff.value = currentTime()
updatePreview()
}

function autoEnd() {
el.endTime.value = currentTime()
updatePreview()
}

function renderReasonButtons() {
el.reasonOptions.innerHTML = ""
const options = REASON_OPTIONS[flightResult] || []
options.forEach(item => {
const active = selectedReasons.includes(item)
const button = document.createElement("button")
button.type = "button"
button.className = active ? "reasonBtn active" : "reasonBtn"
button.textContent = item
button.onclick = () => toggleReason(item)
el.reasonOptions.appendChild(button)
})
}


function setBattleResult(value) {
battleResult = value
flightResult = ""
selectedReasons = []
refreshPostTakeoffView()
updatePreview()
}

function setFlightResult(value) {
flightResult = value
selectedReasons = []
refreshPostTakeoffView()
updatePreview()
}

function setTrainingResult(value) {
flightResult = value
refreshPostTakeoffView()
updatePreview()
}

function toggleReason(value) {
if (selectedReasons.includes(value)) {
selectedReasons = selectedReasons.filter(item => item !== value)
} else {
selectedReasons = [...selectedReasons, value]
}
renderReasonButtons()
updatePreview()
}

function refreshPostTakeoffView() {
renderExclusiveResultButtons(el.battleResults, BATTLE_RESULTS, battleResult, setBattleResult)
renderExclusiveResultButtons(el.flightResults, COMBAT_FLIGHT_RESULTS, flightResult, setFlightResult)
renderExclusiveResultButtons(el.trainingResults, TRAINING_FLIGHT_RESULTS, flightResult, setTrainingResult)
renderReasonButtons()
updateOutcomeVisibility()
}

function updateOutcomeVisibility() {
showWhen(el.combatOutcomeBlock, hasTakenOff && !trainingMode)
showWhen(el.trainingOutcomeBlock, hasTakenOff && trainingMode)
showWhen(el.targetTypeBlock, hasTakenOff && !trainingMode)
showWhen(el.combatFields, !trainingMode)
showWhen(el.noTaskTargetBtn, !trainingMode)
if (trainingMode) {
showWhen(el.flightOutcomeBlock, false)
showWhen(el.reasonBlock, false)
showWhen(el.destroyCoords, false)
} else {
showWhen(el.flightOutcomeBlock, hasTakenOff && battleResult === "Ціль не знищено")
showWhen(el.reasonBlock, hasTakenOff && battleResult === "Ціль не знищено" && Boolean(flightResult))
showWhen(el.destroyCoords, hasTakenOff && battleResult === "Ціль знищено")
}
}

function toggleTraining() {
trainingMode = el.trainingToggle.checked
battleResult = ""
flightResult = ""
selectedReasons = []
syncTrainingTarget()
document.body.classList.toggle("training", trainingMode)
refreshPostTakeoffView()
updatePreview()
}

function validateTakeoff() {
if (!el.crew.value.trim()) {
alert("Вкажіть екіпаж")
return false
}
if (!el.unit.value.trim()) {
alert("Вкажіть підрозділ")
return false
}
if (!uavConfig.name) {
alert("Вкажіть назву БПЛА")
return false
}
if (!el.serial.value.trim()) {
alert("Вкажіть серійний номер")
return false
}
if (!el.target.value.trim()) {
alert("Вкажіть номер цілі")
return false
}
if (!el.town.value.trim()) {
alert("Вкажіть район виконання завдань")
return false
}
return true
}

function buildTakeoffReport() {
return [
`Екіпаж: «${el.crew.value}», ${el.unit.value}`,
`Час зльоту: ${el.takeoff.value} Ціль: ${targetLabel()}`,
`Висота: ${el.height.value} м`,
trainingMode ? "" : `А: ${el.azimuth.value}°; К: ${el.course.value}°; Д: ${el.distance.value} м`,
formatUavLine(),
`Р-н виконання завдань: н.п. ${el.town.value}`
].filter(Boolean).join("\n")
}

function buildCombatFinishReport() {
const lines = [
`Екіпаж: «${el.crew.value}», ${el.unit.value}`,
`Час зльоту: ${el.takeoff.value}`,
`${finishLabel()}: ${el.endTime.value}`,
`Ціль: ${fullTargetLabel()}`,
formatUavLine()
]
if (battleResult === "Ціль знищено") {
let destroyLine = "Ціль знищено"
if (el.az2.value || el.dist2.value || el.h2.value) {
destroyLine += ` А: ${el.az2.value}°; Д: ${el.dist2.value} м; В: ${el.h2.value} м`
}
lines.push(destroyLine)
} else {
lines.push("Ціль не знищено")
const resultLine = formatResultLine()
if (resultLine) {
lines.push(`Результат: ${resultLine}`)
}
}
lines.push(formatWarheadUsage())
lines.push(`Р-н виконання завдань: н.п. ${el.town.value}`)
return lines.filter(Boolean).join("\n")
}

function buildTrainingFinishReport() {
const lines = [
`Екіпаж: «${el.crew.value}», ${el.unit.value}`,
`Час зльоту: ${el.takeoff.value}`,
`${finishLabel()}: ${el.endTime.value}`,
`Ціль: ${targetLabel()}`,
formatUavLine()
]
if (flightResult) {
lines.push(`Результат: ${flightResult}`)
}
lines.push(`Р-н виконання завдань: н.п. ${el.town.value}`)
return lines.filter(Boolean).join("\n")
}

function buildCurrentReport() {
if (!hasTakenOff) {
return buildTakeoffReport()
}
if (!el.endTime.value) {
return trainingMode ? buildTrainingInterimReport() : buildCombatInterimReport()
}
return trainingMode ? buildTrainingFinishReport() : buildCombatFinishReport()
}

function buildCombatInterimReport() {
const lines = [
`Екіпаж: «${el.crew.value}», ${el.unit.value}`,
`Час зльоту: ${el.takeoff.value}`,
`Ціль: ${fullTargetLabel()}`,
formatUavLine()
]
if (battleResult) {
lines.push(`Результат бою: ${battleResult}`)
}
const resultLine = formatResultLine()
if (resultLine) {
lines.push(`Результат: ${resultLine}`)
}
lines.push(`Р-н виконання завдань: н.п. ${el.town.value}`)
return lines.filter(Boolean).join("\n")
}

function buildTrainingInterimReport() {
const lines = [
`Екіпаж: «${el.crew.value}», ${el.unit.value}`,
`Час зльоту: ${el.takeoff.value}`,
`Ціль: ${targetLabel()}`,
formatUavLine()
]
if (flightResult) {
lines.push(`Результат: ${flightResult}`)
}
lines.push(`Р-н виконання завдань: н.п. ${el.town.value}`)
return lines.filter(Boolean).join("\n")
}

function updatePreview() {
el.report.textContent = buildCurrentReport()
}

function takeoff() {
if (!validateTakeoff()) return
if (!el.takeoff.value) {
el.takeoff.value = currentTime()
}
hasTakenOff = true
refreshPostTakeoffView()
showWhen(el.afterTakeoff, true)
showWhen(el.reportBlock, true)
showWhen(el.logBlock, true)
showWhen(el.preTakeoffFields, false)
copy(buildTakeoffReport())
updatePreview()
}

function validateFinish() {
if (trainingMode) {
return true
}
if (!battleResult) {
alert("Вкажіть результат бою")
return false
}
if (battleResult === "Ціль не знищено" && !flightResult) {
alert("Вкажіть результат польоту")
return false
}
return true
}

function finish() {
if (!validateFinish()) return
if (!el.endTime.value.trim()) {
el.endTime.value = currentTime()
}
const reportText = trainingMode ? buildTrainingFinishReport() : buildCombatFinishReport()
copy(reportText)
saveFlightLog()
el.report.textContent = reportText
}

function saveFlightLog() {
const log = JSON.parse(localStorage.getItem("flightLog") || "[]")
const now = new Date()
const stamp = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
const targetText = trainingMode ? targetLabel() : fullTargetLabel()
const resultText = trainingMode ? (flightResult || "-") : (battleResult === "Ціль знищено" ? battleResult : `${battleResult || "-"} / ${flightResult || "-"}`)
log.unshift(`${stamp} | ${targetText} | ${resultText}`)
if (log.length > 50) {
log.pop()
}
localStorage.setItem("flightLog", JSON.stringify(log))
renderFlightLog()
}

function renderFlightLog() {
const log = JSON.parse(localStorage.getItem("flightLog") || "[]")
const container = document.getElementById("flightLog")
container.innerHTML = ""
log.forEach(item => {
const div = document.createElement("div")
div.className = "logEntry"
div.textContent = item
container.appendChild(div)
})
}

async function copyFlightLog() {
const log = JSON.parse(localStorage.getItem("flightLog") || "[]")
await copy(log.join("\n"))
}

function clearFlightLog() {
if (!confirm("Очистити журнал польотів?")) return
localStorage.removeItem("flightLog")
renderFlightLog()
}

function newFlight() {
prepareReload(true)
}

el.sendReportBtn.onclick = () => {
el.sendMenu.style.display = "flex"
}

el.sendCancelBtn.onclick = () => {
el.sendMenu.style.display = "none"
}

el.sendMenu.onclick = event => {
if (event.target === el.sendMenu) {
el.sendMenu.style.display = "none"
}
}

el.sendWhatsBtn.onclick = () => {
window.open("https://wa.me/?text=" + encodeURIComponent(el.report.textContent), "_blank")
el.sendMenu.style.display = "none"
}

el.sendDiscBtn.onclick = async () => {
await copy(el.report.textContent)
window.open("https://discord.com/app", "_blank")
alert("Повідомлення скопійовано. Вставте його в Discord.")
el.sendMenu.style.display = "none"
}

el.uavSelectBtn.onclick = openUavModal
el.uavCancelBtn.onclick = closeUavModal
el.uavClearBtn.onclick = clearUavSelection
el.uavConfirmBtn.onclick = confirmUavSelection
el.uavMenu.onclick = event => {
if (event.target === el.uavMenu) {
closeUavModal()
}
};

[el.unit, el.crew, el.town, el.serial, el.target, el.azimuth, el.course, el.distance, el.height, el.takeoff, el.endTime, el.targetType, el.az2, el.dist2, el.h2].forEach(input => {
input.addEventListener("input", updatePreview)
});

[el.unit, el.crew, el.town, el.serial].forEach(input => {
input.addEventListener("input", () => persistSettings())
input.addEventListener("change", () => persistSettings())
});

let appInitialized = false

function initializeApp() {
if (appInitialized) return
appInitialized = true
loadFromLocalStorage()
trainingMode = el.trainingToggle.checked
syncTrainingTarget()
document.body.classList.toggle("training", trainingMode)
refreshPostTakeoffView()
renderUavModal()
updatePreview()
}

initializeApp()
document.addEventListener("DOMContentLoaded", initializeApp, { once: true })

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister())
  })
}








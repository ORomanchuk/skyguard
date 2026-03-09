/* ---------------- DOM ---------------- */

const el = {

unit: document.getElementById("unit"),
crew: document.getElementById("crew"),
town: document.getElementById("town"),
uav: document.getElementById("uav"),
warhead: document.getElementById("warhead"),

serial: document.getElementById("serial"),

target: document.getElementById("target"),

azimuth: document.getElementById("azimuth"),
course: document.getElementById("course"),
distance: document.getElementById("distance"),

height: document.getElementById("height"),

takeoff: document.getElementById("takeoff"),
endTime: document.getElementById("endTime"),

report: document.getElementById("reportPreview"),

afterTakeoff: document.getElementById("afterTakeoff"),

combatFields: document.getElementById("combatFields"),

targetType: document.getElementById("targetType"),

results: document.getElementById("results")

}

const reasonBlock = document.getElementById("reasonBlock")
const destroyCoords = document.getElementById("destroyCoords")
const reason = document.getElementById("reason")

const az2 = document.getElementById("az2")
const dist2 = document.getElementById("dist2")
const h2 = document.getElementById("h2")

/* ---------------- splash ---------------- */

document.addEventListener("DOMContentLoaded", ()=>{

setTimeout(()=>{

const splash=document.getElementById("splash")

splash.classList.add("hidden")

setTimeout(()=>splash.style.display="none",600)

},1200)

})

/* ---------------- state ---------------- */

let selectedResult=""
let trainingMode=false

/* ---------------- helpers ---------------- */

function currentTime(){

return new Date().toLocaleTimeString('uk-UA',{
hour:'2-digit',
minute:'2-digit'
})

}

async function copy(text){

await navigator.clipboard.writeText(text)

toast()

}

function toast(){

const t=document.getElementById("toast")

t.style.display="block"

setTimeout(()=>t.style.display="none",2000)

}

/* ---------------- storage ---------------- */

function saveFields(){

["unit","crew","town","uav","warhead"].forEach(id=>{
localStorage.setItem(id,el[id].value)
})

}

function loadSavedFields(){

["unit","crew","town","uav","warhead"].forEach(id=>{
el[id].value=localStorage.getItem(id)||""
})

}

["unit","crew","town","uav","warhead"].forEach(id=>{
el[id].addEventListener("input",saveFields)
})

/* ---------------- training ---------------- */

function toggleTraining(){

trainingMode=document.getElementById("trainingToggle").checked

document.body.classList.toggle("training",trainingMode)

el.combatFields.style.display=trainingMode?"none":"block"
el.warhead.style.display=trainingMode?"none":"block"
targetTypeBlock.style.display=trainingMode?"none":"block"

el.target.value=trainingMode?"Тренувальний політ":""

buildResults()
updatePreview()

}

/* ---------------- inputs ---------------- */

function setValue(field,value){

const input = document.getElementById(field)

if(input){
input.value = value
updatePreview()
}

}

function autoTakeoff(){

el.takeoff.value=currentTime()

updatePreview()

}

function autoEnd(){

el.endTime.value=currentTime()

updatePreview()

}

function setTarget(t){

el.targetType.value=t

updatePreview()

}

/* ---------------- results ---------------- */

function buildResults(){

let list=trainingMode
?["Борт повернуто","Борт втрачено"]
:["Ціль знищено","Підрив борта біля цілі","Підрив борта","Борт повернуто","Борт втрачено"]

el.results.innerHTML=""

list.forEach(r=>{

let b=document.createElement("button")

b.innerText=r
b.className="resultBtn"
b.onclick=()=>toggleResult(b,r)

el.results.appendChild(b)

})

}

function toggleResult(btn,r){

if(selectedResult===r){

selectedResult=""
buildResults()

reasonBlock.classList.add("hidden")
destroyCoords.classList.add("hidden")

return
}

selectedResult=r

document.querySelectorAll(".resultBtn").forEach(b=>b.remove())

btn.classList.add("active")

el.results.appendChild(btn)

if(trainingMode){

reasonBlock.classList.add("hidden")

if(r==="Борт втрачено"){
destroyCoords.classList.remove("hidden")
}else{
destroyCoords.classList.add("hidden")
}

}else{

if(["Підрив борта","Борт повернуто","Борт втрачено"].includes(r))
reasonBlock.classList.remove("hidden")

if(["Ціль знищено","Підрив борта біля цілі","Підрив борта","Борт втрачено"].includes(r))
destroyCoords.classList.remove("hidden")

}

updatePreview()

}

/* ---------------- target label ---------------- */

function targetLabel(){

let val=el.target.value.trim()

if(val==="") return "Без видачі"
if(val==="Тренувальний політ") return "Тренувальний політ"

let n=parseInt(val)

if(!isNaN(n)){

if(n>=1&&n<=6999) return val+" (Skymap)"
if(n>=7000&&n<=9999) return val+" (Віраж)"

}

return val

}

/* ---------------- report parts ---------------- */

function baseReport(){

return `- Екіпаж: «${el.crew.value}», ${el.unit.value}
- Час зльоту: ${el.takeoff.value}`

}

function flightData(){

let targetText=targetLabel()

if(el.targetType.value){
targetText+=` (${el.targetType.value})`
}

let text=
`- Номер цілі: ${targetText}
- Висота: ${el.height.value} м`

if(!trainingMode){

text+=`
- А: ${el.azimuth.value}°; К: ${el.course.value}°; Д: ${el.distance.value} м`

}

text+=`
- БПЛА «${el.uav.value}»- ${el.serial.value}
- н.п. ${el.town.value}`

return text

}

/* ---------------- preview ---------------- */

function updatePreview(){

let txt=
`${baseReport()}
${flightData()}`

if(selectedResult){

txt+=`
- ${selectedResult}`

if(selectedResult!=="Борт повернуто"&&!trainingMode){

txt+=`
- Витрата БЧ: ${el.warhead.value}`

}

}

el.report.textContent=txt

}

/* ---------------- takeoff ---------------- */

function validateTakeoff(){

if(!el.crew.value){
alert("Вкажіть екіпаж")
return false
}

if(!el.uav.value){
alert("Вкажіть БПЛА")
return false
}

return true

}

function takeoff(){

if(!validateTakeoff()) return

if(!el.takeoff.value){
el.takeoff.value=currentTime()
}

el.afterTakeoff.classList.remove("hidden")

let txt=
`${baseReport()}
${flightData()}`

copy(txt)

updatePreview()

}

/* ---------------- finish ---------------- */

function finish(){

let label="Час посадки"

if(["Ціль знищено","Підрив борта біля цілі"].includes(selectedResult))
label="Час знищення цілі"

if(["Підрив борта","Борт втрачено"].includes(selectedResult))
label="Час втрати борта"

let txt=
`- Екіпаж: «${el.crew.value}», ${el.unit.value}
- Час зльоту: ${el.takeoff.value}
- ${label}: ${el.endTime.value}
${flightData()}`

if(selectedResult){

if(trainingMode){

txt+=`
- ${selectedResult}`

}else{

if(["Ціль знищено","Підрив борта біля цілі"].includes(selectedResult)){

txt+=`
- ${selectedResult}`

}else{

txt+=`
- ${reason.value}, ${selectedResult.toLowerCase()}`

}

}

}

if(!trainingMode&&selectedResult!=="Борт повернуто"){

txt+=`
- Витрата БЧ: ${el.warhead.value}`

}

if(destroyCoords.style.display!=="none"&&selectedResult!=="Борт повернуто"){

if(az2.value||dist2.value||h2.value){

txt+=`
- А: ${az2.value}°; Д: ${dist2.value} м; В: ${h2.value} м`

}

}

copy(txt)

saveFlightLog(txt)

el.report.textContent=txt

}

/* ---------------- log ---------------- */

function saveFlightLog(){

let log=JSON.parse(localStorage.getItem("flightLog")||"[]")

const now=new Date()

const date=
String(now.getDate()).padStart(2,'0')+"."+
String(now.getMonth()+1).padStart(2,'0')+"."+
now.getFullYear()

const time=
String(now.getHours()).padStart(2,'0')+":"+
String(now.getMinutes()).padStart(2,'0')

let targetText=el.target.value||"Без видачі"

let entry=`${date} ${time} | ${targetText} | ${selectedResult||"-"}`

log.unshift(entry)

if(log.length>50) log.pop()

localStorage.setItem("flightLog",JSON.stringify(log))

renderFlightLog()

}

function renderFlightLog(){

let log=JSON.parse(localStorage.getItem("flightLog")||"[]")

const container=document.getElementById("flightLog")

container.innerHTML=""

log.forEach(item=>{

let div=document.createElement("div")

div.className="logEntry"

div.textContent=item

container.appendChild(div)

})

}

/* ---------------- new flight ---------------- */

function newFlight(){

el.target.value=""
el.height.value=""

el.azimuth.value=""
el.course.value=""
el.distance.value=""

az2.value=""
dist2.value=""
h2.value=""

el.takeoff.value=""
el.endTime.value=""

selectedResult=""

buildResults()

destroyCoords.classList.add("hidden")
reasonBlock.classList.add("hidden")

updatePreview()

}

/* ---------------- send menu ---------------- */

const sendMenu=document.getElementById("sendMenu")
const sendReportBtn=document.getElementById("sendReportBtn")
const sendCancelBtn=document.getElementById("sendCancelBtn")
const sendWhatsBtn=document.getElementById("sendWhatsBtn")
const sendDiscBtn=document.getElementById("sendDiscBtn")

sendReportBtn.onclick=()=>sendMenu.style.display="flex"

sendCancelBtn.onclick=()=>sendMenu.style.display="none"

sendMenu.onclick=e=>{
if(e.target===sendMenu) sendMenu.style.display="none"
}

sendWhatsBtn.onclick=()=>{

let url="https://wa.me/?text="+encodeURIComponent(el.report.textContent)

window.open(url,"_blank")

sendMenu.style.display="none"

}

sendDiscBtn.onclick=()=>{

navigator.clipboard.writeText(el.report.textContent)

window.open("https://discord.com/app","_blank")

alert("Доповідь скопійовано. Вставте її в Discord.")

sendMenu.style.display="none"

}

/* ---------------- log buttons ---------------- */

function copyFlightLog(){

let log=JSON.parse(localStorage.getItem("flightLog")||[])

navigator.clipboard.writeText(log.join("\n"))

alert("Журнал скопійовано")

}

function clearFlightLog(){

if(!confirm("Очистити журнал польотів?")) return

localStorage.removeItem("flightLog")

renderFlightLog()

}

/* ---------------- init ---------------- */

buildResults()

Object.values(el).forEach(i=>{
if(i.tagName==="INPUT"||i.tagName==="SELECT")
i.addEventListener("input",updatePreview)
})

loadSavedFields()
renderFlightLog()

if("serviceWorker" in navigator){
navigator.serviceWorker.register("sw.js")
}
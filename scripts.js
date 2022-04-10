function $(selector) {
    return document.querySelector(selector)
}
function handleEvent(event, parentSelector, targetSelector, callback) {
    const parent = document.querySelector(parentSelector)
    parent.addEventListener(event, event => {
        const target = event.path[0]
        const matches = target.matches && target.matches(targetSelector)
        const matchesSelector = target.matchesSelector && target.matchesSelector(targetSelector)
        if (matches || matchesSelector) {
            return callback.call(target, event)
        }
    })
}

// Init
const $cursor = $('#cursor')
const $canvas = $('#draw')
const ctx = $canvas.getContext('2d')

if (window.innerWidth > 1024) $canvas.width  = window.innerWidth - 300
else $canvas.width  = window.innerWidth
$canvas.height = window.innerHeight

const defaultColor = '#2c3e50'

let isMouseDown = false
let isReplay    = false
let eraser      = false
let coords      = JSON.parse(localStorage.getItem('coords')) || []
let colors      = JSON.parse(localStorage.getItem('colors')) || []
let lineWidth   = Number(localStorage.getItem('thickness')) || 15
let color       = JSON.parse(localStorage.getItem('color')) || defaultColor

// Settings
ctx.lineWidth = lineWidth
ctx.strokeStyle = color
ctx.fillStyle = color

$('.thickness-picker input').value = lineWidth
$('.color-picker input').value = color
colors.forEach(color => {
    const el = document.createElement('span')
    el.style.background = color
    el.dataset.color = color
    $('.colors').appendChild(el)
})
$('.result span').style.cssText = `width:${lineWidth}px; height:${lineWidth}px; background:${color}`

if (coords.length > 0) replay()


// Controllers
function clear() {
    localStorage.removeItem('coords')
    ctx.clearRect(0, 0, $canvas.width, $canvas.height)
    eraser = false
    $('.btn.eraser').classList.remove('active')
    $('.btn.painter').classList.add('active')
}
function clearAll() {
    clear()
    coords = []
    localStorage.removeItem('colors')
    localStorage.removeItem('color')
    localStorage.removeItem('thickness')
    lineWidth = 15
    ctx.lineWidth = 15
    color = defaultColor
    ctx.strokeStyle = defaultColor
    ctx.fillStyle = defaultColor
    $('.colors').innerHTML = ''
    $('.thickness-picker input').value = 15
    $('.color-picker input').value = defaultColor
    $('.result span').style.cssText = `width:15px; height:15px; background:#2c3e50`
}
function save(name, value) {
    localStorage.setItem(name, JSON.stringify(value))
}
function draw(x, y) {
    ctx.lineTo(x, y)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x, y)
}
function replay() {
    clear()
    isReplay = true
    const count = coords.length
    for (let i in coords) {
        setTimeout(()=> {
            if (!coords.length) {
                ctx.beginPath()
                return
            }
            
            const currentCoords = coords[i]
            lineWidth = currentCoords.lineWidth
            color = currentCoords.color
            ctx.lineWidth = lineWidth
            ctx.strokeStyle = color
            ctx.fillStyle = color
            
            draw(currentCoords.x, currentCoords.y)
            
            if (i == count - 1) {
                lineWidth = $('.thickness-picker input').value
                color = $('.color-picker input').value
                ctx.lineWidth = lineWidth
                ctx.strokeStyle = color
                ctx.fillStyle = color
                isReplay = false
            }
        }, 10 * i)
    }
}
function changeColor(value) {
    $('.btn.eraser').classList.remove('active')
    $('.btn.painter').classList.add('active')
    eraser = false
    save('color', value)
    
    color = value
    ctx.strokeStyle = value
    ctx.fillStyle = value

    $('.result span').style.cssText = `width:${lineWidth}px; height:${lineWidth}px; background:${value}`
}

// Actions
function touchstart(cx, cy, which) {
    if(window.innerWidth <= 1024 || (window.innerWidth > 1024 && which == 1)) {
        isMouseDown = true
        let x = cx
        let y = cy
    
        coords.push({
            x, y, color, lineWidth
        })
    
        draw(x, y)
    }
}
$canvas.addEventListener('mousedown', e => {
    if (!isReplay) touchstart(e.clientX, e.clientY, e.which)
})
$canvas.addEventListener('touchstart', e => {
    if (!isReplay) touchstart(e.touches[0].clientX, e.touches[0].clientY)
})

function touchend() {
    isMouseDown = false
    ctx.beginPath()
    coords.push('mouseup')
}
window.addEventListener('mouseup', e => {
    touchend()
})
$canvas.addEventListener('touchend', e => {
    touchend()
})

function touchmove(cx, cy, px, py) {
    if (isMouseDown) {
        let x = cx
        let y = cy
    
        coords.push({
            x, y, color, lineWidth
        })
    
        draw(x, y)
    }
    if(px <= $canvas.width) {
        $cursor.style.display = 'block'
        if(!eraser) $cursor.style.cssText = `transform: translate(${px}px, ${py-32}px);`
        else $cursor.style.cssText = `transform: translate(${px}px, ${py-32}px) rotate(180deg);`
    } else {
        $cursor.style.display = 'none'
    }
}
$('main').addEventListener('mousemove', e => {
    touchmove(e.clientX, e.clientY, e.pageX, e.pageY)
})
$('main').addEventListener('touchmove', e => {
    touchmove(e.touches[0].clientX, e.touches[0].clientY, e.touches[0].pageX, e.touches[0].pageY)
})

$('.btn.reset').addEventListener('click', clearAll)
$('.btn.replay').addEventListener('click', replay)

$('.btn.save').addEventListener('click', ()=> {
    save('coords', coords)
})

$('.btn.download').addEventListener('click', ()=> {
    $('#download').setAttribute('href', $canvas.toDataURL())
    $('#download').click()
})

$('.btn.painter').addEventListener('click', ()=> {
    $('.btn.eraser').classList.remove('active')
    $('.btn.painter').classList.add('active')
    color = $('.color-picker input').value
    ctx.strokeStyle = color
    ctx.fillStyle = color
    eraser = false
})

$('.btn.eraser').addEventListener('click', ()=> {
    $('.btn.eraser').classList.add('active')
    $('.btn.painter').classList.remove('active')
    color = '#fff'
    ctx.strokeStyle = color
    ctx.fillStyle = color
    eraser = true
})

// Выбираем толщину
$('.thickness-picker input').addEventListener('change', function() {
    lineWidth = this.value
    ctx.lineWidth = lineWidth
    $('.result span').style.cssText = `width:${lineWidth}px; height:${lineWidth}px; background:${color}`
    save('thickness', lineWidth)
})

// Выбираем основной цвет и сохраняем его
$('.color-picker input').addEventListener('change', function() {
    const el = document.createElement('span')
    el.style.background = this.value
    el.dataset.color = this.value
    $('.colors').appendChild(el)
    colors.push(this.value)
    changeColor(this.value)
    save('colors', colors)
})

// Выбираем цвет из сохраненных
handleEvent('click', '.colors', 'span', ({ target }) => {
    const color = target.dataset.color
    $('.color-picker input').value = color
    changeColor(color)
})

$('.settings').addEventListener('click', ()=> {
    $('aside').classList.toggle('active')
    $('.settings').classList.toggle('active')
})
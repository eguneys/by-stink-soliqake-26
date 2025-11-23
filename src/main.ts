import './style.css'
import { Loop } from "./loop_input"
import { DragHandler } from './drag'
import { load_font } from './assets'
import { box_intersect, lerp, lerp_angle2, type XY, type XYWH } from './util'
import { Vec2 } from './math/vec2'

type DragXY = {
    xy: XY
    decay: XY
    dd: Dd
}

let drag_xy: DragXY | undefined

let cursor_xy: XY
let cursor_dxy: XYWH
let cursor_a: number

type Dd = {
    xy: XY
}

let ddd: [Dd, Dd]

let lines_t: number
let waves_t: number
let dots_t: number

function _init() {

    lines_t = 0
    waves_t = 0
    dots_t = 0

    ddd = [{ xy: [0, 0] }, { xy: [100, 100] }]

    cursor_xy = [500, 500]
    cursor_dxy = [0, 0, 500, 500]
    cursor_a = 0

    cx.lineJoin = 'round'
    cx.lineWidth = 20
    cx.lineCap = 'round'
}

export const PI2 = Math.PI * 2

let t = 0
function _update(delta: number) {
    t += delta

    if (cursor_intersect(lines_box)) {
        lines_t += delta
    }

    if (cursor_intersect(waves_box)) {
        waves_t += delta
    }

    if (cursor_intersect(dots_box)) {
        dots_t += delta
    }

    let is_hovering = drag.is_hovering

    if (is_hovering) {
        cursor_xy[0] = lerp(cursor_xy[0], is_hovering[0], 0.35)
        cursor_xy[1] = lerp(cursor_xy[1], is_hovering[1], 0.35)

        if (drag_xy) {
            drag_xy.xy[0] = lerp(drag_xy.xy[0], is_hovering[0], 0.35)
            drag_xy.xy[1] = lerp(drag_xy.xy[1], is_hovering[1], 0.35)
        }
    }

    if (drag.is_just_down) {
        if (drag_xy === undefined) {
            for (let dd of ddd) {
                if (cursor_intersect(dd_box(dd))) {
                    drag_xy = {
                        xy: [cursor_xy[0], cursor_xy[1]],
                        decay: [dd.xy[0] - cursor_xy[0], dd.xy[1] - cursor_xy[1]],
                        dd
                    }
                }
            }
        }
    }

    if (drag.is_up) {
        if (drag_xy) {
            drag_xy = undefined
        }
    }


    if (drag_xy) {
        drag_xy.dd.xy[0] = drag_xy.xy[0] + drag_xy.decay[0]
        drag_xy.dd.xy[1] = drag_xy.xy[1] + drag_xy.decay[1]
    }


    cursor_dxy[0] = cursor_xy[0] - cursor_dxy[2]
    cursor_dxy[1] = cursor_xy[1] - cursor_dxy[3]


    cursor_dxy[2] = cursor_xy[0]
    cursor_dxy[3] = cursor_xy[1]


    let d = Vec2.make(cursor_dxy[0], cursor_dxy[1]).length

    if (d > 1) {
        cursor_a = lerp_angle2(cursor_a, Math.atan2(cursor_dxy[1], cursor_dxy[0]), 0.08)
    }
}

let _y = 400
let _100 = 350
let _300 = 210
function _render() {
    cx.clearRect(0, 0, 1920, 1080)
    cx.fillStyle = 'white'
    cx.fillRect(0, 0, 1920, 1080)

    rect(780 + Math.sin(t * 0.001) * 320, 35)
    cx.save()
    cx.clip()
    text('Hello World!', 500 + Math.sin(t * 0.01) * 30, 200, 100)
    cx.restore()

    let [x, y] = cursor_xy

    cx.lineWidth = 20


    card(_100, _y)
    card(_100 + _300, _y)
    card(_100 + _300* 2, _y)
    card(_100 + _300 * 3, _y)
    card(_100 + _300 * 4, _y)
    card(_100 + _300 * 5, _y)

    cx.save()
    rect(_100, _y, 180, 240)
    cx.clip()
    lines(lines_t * 0.01)
    cx.restore()

    cx.save()
    rect(_100 + _300, _y, 180, 240)
    cx.clip()
    waves(waves_t * 0.01)
    cx.restore()

    cx.save()
    rect(_100 + _300 * 2, _y, 180, 240)
    cx.clip()
    dots(dots_t * 0.01)
    cx.restore()



    for (let dd of ddd)
    rect(...dd.xy, 70, 70)

    cursor(x, y)


}

function dots(t: number) {
    cx.save()
    cx.rotate(Math.PI * 0.25)
    cx.strokeStyle = colors.black
    cx.lineWidth = 8
    cx.beginPath()
    for (let j = -20; j < 20; j++) {
        for (let i = -20; i < 20; i++) {
            if (i * j % 3 === 0) {
                continue
            }
            let x = j * 200 + i * 100
            let y = j * 100 + i * 100
            x -= Math.sin(t * 0.1) * 4
            y += Math.sin(t * 0.1) * 4
            x -= t
            y -= t
            cx.moveTo(x + 40, y)
            cx.arc(x, y, 40, 0, PI2)
        }
    }
    cx.stroke()

    cx.lineWidth = 5
    cx.beginPath()
    for (let j = -20; j < 20; j++) {
        for (let i = -20; i < 20; i++) {
            if (i * j % 3 === 0) {
            } else {
                continue
            }
            let x = j * 200 + i * 100
            let y = j * 100 + i * 100
            if (i % 4 === 0) {
                x += Math.sin(t)
                y -= Math.sin(t)
            } else if (j % 4 === 1){
                x += Math.cos(t)
                y -= Math.cos(t)
            }
            if (j % 4 === 0) {
                if (i % 2 === 0) {
                    x += Math.sin(t)
                    y += Math.sin(t)
                } else {
                    x += Math.cos(t)
                    y += Math.cos(t)
                }
            }
            x -= t
            y -= t
            cx.moveTo(x + 40, y)
            cx.arc(x, y, 40, 0, PI2)
        }
    }
    cx.stroke()


    cx.restore()

}


function waves(t: number) {

    cx.strokeStyle = colors.black
    cx.lineWidth = 8
    cx.save()
    cx.rotate(Math.PI * 0.25)

    cx.beginPath()
    for (let j = -10; j < 10; j++) {
        let flip = j % 2 === 0
        if (flip) {
            continue
            cx.save()
            cx.lineWidth = 5
            cx.translate(-100, -100)
        }
        for (let i = 0; i < 8; i++) {
            cx.moveTo(i * 400 + 0, j * 100)
            cx.arc(i * 400 + 100, j * 100, 100, Math.PI, 0)
            cx.moveTo(i * 400 + 400, j * 100)
            cx.arc(i * 400 + 300, j * 100, 100, 0, Math.PI)
        }
        if (flip) {
            cx.restore()
        }
    }
    cx.stroke()

    cx.lineWidth = 5
    for (let j = -20; j < 10; j++) {
        let flip = j % 2 === 0
        if (flip) {
            cx.save()
            cx.lineWidth = 8
            cx.translate(t + -500, -500)
            cx.rotate(Math.PI * 0.33)
        } else {
            continue
        }
        for (let i = 0; i < 8; i++) {
            cx.moveTo(i * 400 + 0, j * 100)
            cx.arc(i * 400 + 100, j * 100, 100, Math.PI, 0)
            cx.moveTo(i * 400 + 400, j * 100)
            cx.arc(i * 400 + 300, j * 100, 100, 0, Math.PI)
        }
        if (flip) {
            cx.restore()
        }
    }
    cx.stroke()

    cx.restore()
}

export function dot(x: number, y: number) {
    cx.fillStyle = 'red'
    cx.beginPath()
    cx.arc(x, y, 10, 0, PI2)
    cx.fill()
}

function lines(t: number) {
    cx.lineWidth = 8
    cx.strokeStyle = colors.black
    cx.beginPath()
    for (let i = -10; i < 10; i++) {
        cx.moveTo(t + 0 + i * 100, 0)
        cx.lineTo(t + 800 + i * 100, 1000)
    }
    cx.stroke()

    cx.lineWidth = 6
    cx.beginPath()
    for (let i = -100; i < 100; i++) {
        cx.moveTo(i * 100 + 50, 0)
        cx.lineTo(1000 + i * 100 + 50, 1080)
    }
    cx.stroke()
}


function card(x: number, y: number) {

    rect(x, y, 180, 240)

    rect(x, y - 130, 180, 100)
    rect(x, y + 240 + 30, 180, 100)
}

function cursor(x: number, y: number) {

    cx.lineWidth = 12
    let _60 = 36
    cx.strokeStyle = colors.black
    cx.beginPath()
    cx.moveTo(x + _60, y)
    cx.lineTo(x, y)
    cx.lineTo(x, y + _60)
    cx.stroke()

    cx.strokeStyle = colors.black
    cx.lineWidth = 12
    cx.beginPath()
    cx.moveTo(x + 40, y + 40)
    cx.lineTo(x + 20, y + 20)
    cx.stroke()
}

function rect(x: number, y: number, w: number = 200, h: number = 200) {

    cx.lineWidth = 8
    cx.strokeStyle = colors.black
    cx.beginPath()
    cx.roundRect(x, y + Math.sin(t * 0.01), w, h, 8)
    cx.stroke()

    cx.lineWidth = 5
    cx.strokeStyle = colors.white
    cx.beginPath()
    cx.roundRect(x + 4, y + 4 + Math.sin(t * 0.01), w - 8, h - 8, 8)
    cx.stroke()
}


function cursor_intersect(box: XYWH) {
    return box_intersect(cursor_box(), box)
}

function cursor_box(): XYWH {
    return [cursor_xy[0], cursor_xy[1], 10, 10]
}

function dd_box(dd: Dd): XYWH {
    return [dd.xy[0], dd.xy[1], 80, 80]
}


const card_box = (x: number, y: number): XYWH => {

    return [x, y, 180, 240]
}

const lines_box = card_box(_100, _y)
const waves_box = card_box(_100 + _300 * 1, _y)
const dots_box = card_box(_100 + _300 * 2, _y)




type Color = string

const colors = {
    white: '#ffffff',
    black: '#000000'
}

function text(text: string, x: number, y: number, size: number, color: Color = colors.black) {
    cx.fillStyle = color
    cx.font = `${42 + size}px ConcertOne`
    cx.shadowColor = colors.black
    cx.shadowBlur = 3

    cx.fillText(text, x, y)
    cx.shadowBlur = 0
}

function _after_render() {}

let drag: DragHandler

let cx: CanvasRenderingContext2D

function init_canvas() {

    let canvas = document.createElement('canvas')

    canvas.width = 1920
    canvas.height = 1080

    cx = canvas.getContext('2d')!

    return canvas
}

async function main(el: HTMLElement) {

    let canvas = init_canvas()
    let $ = document.createElement('div')
    $.classList.add('content')
    canvas.classList.add('interactive')
    $.appendChild(canvas)
    el.appendChild($)

    _init()

    await load_font('ConcertOne', './ConcertOne-Regular.ttf')

    Loop(_update, _render, _after_render)


    drag = DragHandler(canvas)
}


main(document.getElementById('app')!)
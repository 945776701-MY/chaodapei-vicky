const input = document.getElementById('todo-input')
const addBtn = document.getElementById('add-btn')
const dueInput = document.getElementById('due-input')
const prioritySelect = document.getElementById('priority-select')
const list = document.getElementById('todo-list')
const countActive = document.getElementById('count-active')
const countCompleted = document.getElementById('count-completed')
const clearBtn = document.getElementById('clear-completed')
const clearAllBtn = document.getElementById('clear-all')
const emptyState = document.getElementById('empty-state')
const filterButtons = document.querySelectorAll('.filter-btn')

const STORAGE_KEY = 'todo-app-tasks'
let tasks = []
let currentFilter = 'all'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    tasks = Array.isArray(parsed)
      ? parsed.map(t => ({
        ...t,
        priority: t.priority || 'medium',
        dueAt: t.dueAt || '',
        completedAt: t.completedAt || null
      }))
      : []
  } catch {
    tasks = []
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

function updateCounts() {
  const completed = tasks.filter(t => t.completed).length
  const active = tasks.length - completed
  countActive.textContent = `未完成 ${active}`
  countCompleted.textContent = `已完成 ${completed}`
  if (clearBtn) {
    clearBtn.disabled = completed === 0
  }
  if (clearAllBtn) {
    clearAllBtn.disabled = tasks.length === 0
  }
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}年${m}月${d}日`
}

function render() {
  list.innerHTML = ''
  const visibleTasks = tasks.filter(t => currentFilter === 'all' || t.priority === currentFilter)
  if (emptyState) {
    emptyState.style.display = visibleTasks.length === 0 ? 'block' : 'none'
  }
  visibleTasks.forEach(t => {
    const li = document.createElement('li')
    li.className = 'item'
    li.dataset.id = String(t.id)

    const main = document.createElement('div')
    main.className = 'item-main'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'check'
    checkbox.checked = !!t.completed
    checkbox.setAttribute('aria-label', '标记完成')

    const content = document.createElement('div')
    content.className = 'content'

    const text = document.createElement('div')
    text.className = 'text' + (t.completed ? ' completed' : '')
    text.textContent = t.text

    const badge = document.createElement('span')
    const priority = t.priority || 'medium'
    const priorityMap = {
      high: '高',
      medium: '中',
      low: '低'
    }
    badge.className = `priority-badge priority-${priority}`
    badge.textContent = priorityMap[priority] || '中'
    li.classList.add(`priority-${priority}`)

    content.appendChild(text)
    content.appendChild(badge)

    const meta = document.createElement('div')
    meta.className = 'meta'

    const due = document.createElement('span')
    due.className = 'meta-item'
    due.textContent = `要求：${formatDate(t.dueAt)}`

    const completed = document.createElement('span')
    completed.className = 'meta-item'
    completed.textContent = t.completedAt ? `完成：${formatDate(t.completedAt)}` : '完成：—'

    meta.appendChild(due)
    meta.appendChild(completed)

    main.appendChild(checkbox)
    main.appendChild(content)
    main.appendChild(meta)

    const actions = document.createElement('div')
    actions.className = 'item-actions'

    const edit = document.createElement('button')
    edit.className = 'action-btn action-edit'
    edit.type = 'button'
    edit.textContent = '编辑'

    const del = document.createElement('button')
    del.className = 'action-btn action-delete'
    del.type = 'button'
    del.textContent = '删除'

    actions.appendChild(edit)
    actions.appendChild(del)

    li.appendChild(main)
    li.appendChild(actions)
    list.appendChild(li)
  })
  updateCounts()
}

function addTask(text, priority, dueAt) {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (!trimmed) return
  const id = Date.now() + Math.random()
  const level = ['high', 'medium', 'low'].includes(priority) ? priority : 'medium'
  tasks.unshift({
    id,
    text: trimmed,
    completed: false,
    priority: level,
    dueAt: dueAt || '',
    completedAt: null
  })
  save()
  render()
}

function toggleTask(id) {
  const idx = tasks.findIndex(t => String(t.id) === String(id))
  if (idx >= 0) {
    tasks[idx].completed = !tasks[idx].completed
    tasks[idx].completedAt = tasks[idx].completed ? new Date().toISOString() : null
    save()
    render()
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => String(t.id) !== String(id))
  save()
  render()
}

function updateTaskText(id, text) {
  const idx = tasks.findIndex(t => String(t.id) === String(id))
  if (idx >= 0) {
    tasks[idx].text = text
    save()
    render()
  }
}

function clearCompleted() {
  const hasCompleted = tasks.some(t => t.completed)
  if (!hasCompleted) return
  tasks = tasks.filter(t => !t.completed)
  save()
  render()
}

function clearAll() {
  if (tasks.length === 0) return
  const confirmed = window.confirm('确定要清空全部任务吗？')
  if (!confirmed) return
  tasks = []
  save()
  render()
}

addBtn.addEventListener('click', () => {
  addTask(input.value, prioritySelect ? prioritySelect.value : 'medium', dueInput ? dueInput.value : '')
  input.value = ''
  if (dueInput) {
    dueInput.value = ''
  }
  input.focus()
})

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addTask(input.value, prioritySelect ? prioritySelect.value : 'medium', dueInput ? dueInput.value : '')
    input.value = ''
    if (dueInput) {
      dueInput.value = ''
    }
  }
})

function startEdit(li, id) {
  if (li.classList.contains('editing')) return
  const content = li.querySelector('.content')
  const textEl = content ? content.querySelector('.text') : null
  if (!content || !textEl) return
  li.classList.add('editing')
  const original = textEl.textContent
  const inputEl = document.createElement('input')
  inputEl.type = 'text'
  inputEl.className = 'edit-input'
  inputEl.value = original
  content.replaceChild(inputEl, textEl)
  const editBtn = li.querySelector('.action-edit')
  if (editBtn) {
    editBtn.textContent = '保存'
  }
  inputEl.focus()
  inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length)
  let done = false
  const finish = commit => {
    if (done) return
    done = true
    const value = inputEl.value.replace(/\s+/g, ' ').trim()
    if (commit && value) {
      updateTaskText(id, value)
    } else {
      render()
    }
  }
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      finish(true)
    } else if (e.key === 'Escape') {
      finish(false)
    }
  })
  inputEl.addEventListener('blur', () => finish(true))
}

list.addEventListener('click', e => {
  const target = e.target
  const li = target.closest('.item')
  if (!li) return
  const id = li.dataset.id
  if (target.classList.contains('check')) {
    toggleTask(id)
  } else if (target.classList.contains('action-edit')) {
    closeSwipe(li)
    startEdit(li, id)
  } else if (target.classList.contains('action-delete')) {
    closeSwipe(li)
    const text = li.querySelector('.text')
    if (text) {
      text.classList.add('deleting')
    }
    li.classList.add('deleting')
    requestAnimationFrame(() => {
      setTimeout(() => {
        li.classList.add('fade-out')
        setTimeout(() => {
          deleteTask(id)
        }, 220)
      }, 260)
    })
  } else {
    const main = target.closest('.item-main')
    if (main && li.classList.contains('swiped')) {
      closeSwipe(li)
    }
  }
})

let swipeState = null

list.addEventListener('pointerdown', e => {
  const target = e.target
  if (target.closest('.action-btn') || target.classList.contains('check') || target.tagName === 'INPUT') return
  const li = target.closest('.item')
  if (!li) return
  if (li.classList.contains('editing')) return
  const main = li.querySelector('.item-main')
  const actions = li.querySelector('.item-actions')
  if (!main || !actions) return
  li.setPointerCapture(e.pointerId)
  const actionsWidth = actions.offsetWidth || 120
  const startTranslate = li.classList.contains('swiped') ? -actionsWidth : 0
  swipeState = {
    li,
    startX: e.clientX,
    startY: e.clientY,
    currentX: e.clientX,
    currentY: e.clientY,
    startTranslate,
    actionsWidth,
    started: false,
    main,
    pointerId: e.pointerId
  }
})

list.addEventListener('pointermove', e => {
  if (!swipeState || swipeState.pointerId !== e.pointerId) return
  swipeState.currentX = e.clientX
  swipeState.currentY = e.clientY
  const dx = swipeState.currentX - swipeState.startX
  const dy = swipeState.currentY - swipeState.startY
  if (!swipeState.started) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    if (Math.abs(dy) > Math.abs(dx)) {
      swipeState = null
      return
    }
    swipeState.started = true
  }
  const rawTranslate = swipeState.startTranslate + dx
  const translate = Math.max(Math.min(rawTranslate, 0), -swipeState.actionsWidth)
  swipeState.main.style.transition = 'none'
  swipeState.main.style.transform = `translateX(${translate}px)`
})

function openSwipe(li) {
  const actions = li.querySelector('.item-actions')
  const main = li.querySelector('.item-main')
  if (!actions || !main) return
  const width = actions.offsetWidth || 120
  main.style.transition = 'transform .2s ease'
  main.style.transform = `translateX(-${width}px)`
  li.classList.add('swiped')
}

function closeSwipe(li) {
  const main = li.querySelector('.item-main')
  if (!main) return
  main.style.transition = 'transform .2s ease'
  main.style.transform = 'translateX(0)'
  li.classList.remove('swiped')
}

function endSwipe() {
  if (!swipeState) return
  const li = swipeState.li
  const dx = swipeState.currentX - swipeState.startX
  const opened = swipeState.startTranslate < 0
  const openThreshold = swipeState.actionsWidth / 2
  const shouldOpen = opened ? dx < openThreshold : dx <= -openThreshold
  if (swipeState.started && shouldOpen) {
    openSwipe(li)
  } else {
    closeSwipe(li)
  }
  swipeState = null
}

list.addEventListener('pointerup', endSwipe)
list.addEventListener('pointercancel', endSwipe)

if (clearBtn) {
  clearBtn.addEventListener('click', clearCompleted)
}

if (clearAllBtn) {
  clearAllBtn.addEventListener('click', clearAll)
}

load()
render()

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const value = btn.dataset.filter || 'all'
    currentFilter = value
    filterButtons.forEach(b => b.classList.toggle('active', b === btn))
    render()
  })
})

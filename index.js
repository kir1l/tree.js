function treeInit(selector, options) {
  // находим древо по селектору
  const directoryTree = document.querySelector(selector)
  // проверка селектора
  if (!directoryTree) {
    return console.error('tree: wrong selector')
  }

  if (options.paths) {
    directoryTree.dataset.path = options.paths.rootName
      ? options.paths.rootName
      : 'root'
  }

  // даем id для стилизации
  directoryTree.classList.add('tree')

  // контекстное меню
  function contextMenu(event, parent) {
    // в parent находится селектор родителя folder/file
    if (!options.edit) return // если в объекте настроек не дали возможность редактировать древо

    event.preventDefault() // отменяем открытие контекстного меню по умолчанию
    event.stopPropagation() // останавливаем всплытие что бы не трогать общего родителя

    const contextMenu = document.querySelector('.tree-context-menu')
    const actions = document.querySelectorAll('.options__item')

    // переносим меню под указатель мыши
    contextMenu.style.top = event.clientY - 5
    contextMenu.style.left = event.clientX - 5
    // показываем его
    contextMenu.classList.add('tree-context-menu-active')

    // элемент, по которому кликнули
    let treeNode = event.target
    const nodeParent = treeNode.closest(parent)

    // методы ==============

    // переименовывание
    function rename(htmlElement, cb) {
      const renameInpt = document.createElement('input') // поле для редактирования
      renameInpt.className = 'rename-inpt'

      const name = htmlElement.querySelector('.name')

      name.appendChild(renameInpt) // перемещаем поле для редактирования в имя

      renameInpt.focus() // устанавливаем фокус на инпуте

      // функция сохранения изменений. меняем текст и удаляем поле для изменений
      function saveChanges() {
        renameInpt.remove()
        if (renameInpt.value === '') return
        name.textContent = renameInpt.value
        htmlElement.dataset.name = renameInpt.value
        // если есть callBack, запускаем его, передавая в него элемент, который переименовываем
        if (cb) cb(htmlElement)
      }

      // ловим нажатие на enter и сохраняем изменения
      renameInpt.onkeydown = evt => {
        if (evt.key === 'Enter') {
          saveChanges()
        }
      }
      // ловим клик вне инпута и сохраняем изменения
      renameInpt.onblur = () => {
        saveChanges()
      }
    }

    // функция удаления O_o
    function deleteNode() {
      nodeParent.remove()
    }

    function createNode(act) {
      // ищем папку-родитель, в которую добавим элемент если папки нет, выбираем корневую папку
      const parentFolder = treeNode.closest('.folder')
        ? treeNode.closest('.folder')
        : directoryTree

      parentFolder.classList.add('folder-opened')
      if (act === 'create-file') {
        // создаем файл
        const newFile = document.createElement('div')
        newFile.className = 'file'
        // добавляем в родительскую папку новый файл
        parentFolder.appendChild(newFile)
        // переименовываем, только что созданый файл и обновляем все файлы (что бы установить новому файлу обработчики), генерируем пути
        filesInit()
        rename(newFile, generatePath)
      } else if (act === 'create-folder') {
        // создаем папку
        const newFolder = document.createElement('div')
        newFolder.className = 'folder'
        // добавляем в родительскую папку новую папку
        parentFolder.appendChild(newFolder)
        // переименовываем только что созданый файл и обновляем все файлы (что бы установить новому файлу обработчики), генерируем пути
        foldersInit()
        rename(newFolder, generatePath)
      }
      // открываем родительскую папку
      parentFolder.classList.remove('empty')
    }

    // ===============

    // при уходе мыши с меню скрываем его
    contextMenu.onmouseleave = () =>
      contextMenu.classList.remove('tree-context-menu-active')

    actions.forEach(el => {
      el.onclick = evt => {
        // разные действия в зависимости от действий кнопки
        // удаление
        if (el.dataset.action === 'delete') deleteNode()

        // переименовывание
        if (el.dataset.action === 'rename') {
          rename(nodeParent)
        }

        // добавление
        if (el.dataset.action === 'create') {
          let action = evt.target.dataset.action // в action лежит что именно мы создаем папкку/файл
          if (action === 'create') return // если не файл и не папка то выходим
          createNode(action)
        }
        contextMenu.classList.remove('tree-context-menu-active')
      }
    })
  }

  // генерация путей
  function generatePath(node) {
    if (!options.paths) return
    // родительская папка
    const parentFolder = node.parentNode ? node.parentNode : directoryTree
    // путь относительно корня
    node.dataset.path = `${parentFolder.dataset.path}/${node.dataset.name}`
  }

  // =========== работа с папками
  function foldersInit() {
    const folders = directoryTree.querySelectorAll('.folder') // все папки в древе
    folders.forEach(elem => {
      if (elem.classList.contains('inited')) return // если папка уже проинициализированна - пропускаем

      // создаем иконку
      const icon = document.createElement('div')
      icon.className = 'folder-icon'
      // создаем имя и записываем в него текст из dataset
      const name = document.createElement('span')
      name.className = 'name'
      name.textContent = elem.dataset.name

      // создаем блок с информацией о папке (folder-header)
      const info = document.createElement('div')
      info.className = 'folder-header'
      // вставляем в него имя, иконку
      info.insertAdjacentElement('afterbegin', name)
      info.insertAdjacentElement('afterbegin', icon)

      // если в папке что-то есть, то добавляем треугольник
      const caret = document.createElement('div')
      caret.className = 'caret'
      info.insertAdjacentElement('afterbegin', caret)

      // ловим клик на треугольник и открываем папку
      caret.addEventListener('click', () => {
        elem.classList.toggle('folder-opened')
      })
      // ловим даблклик на элемент и открываем папку
      info.addEventListener('click', ev => {
        if (ev.detail === 2) {
          elem.classList.toggle('folder-opened')
        }
      })
      // проверяем на наличие в папке других папок или файлов (на то что папка не пуста)
      if (!elem.querySelector('.file') && !elem.querySelector('.folder')) {
        // добавляем соответствующий класс пустой папке
        elem.classList.add('empty')
      }

      // добавляем обработчик контекстного меню и передаем селектор родителя
      elem.addEventListener('contextmenu', event =>
        contextMenu(event, '.folder')
      )
      // вставляем блок с информацией о папке в саму папку
      elem.insertAdjacentElement('afterbegin', info)
      // помечаем папку как проинициализированную
      elem.classList.add('inited')

      // генерируем пути
      generatePath(elem)
    })
  }

  // ==================== работа с файлами
  function filesInit() {
    const files = directoryTree.querySelectorAll('.file') // все файлы в древе

    files.forEach(file => {
      // создаем иконку
      const icon = document.createElement('div')
      icon.className = 'file__icon'
      // создаем имя и записываем в него текст из dataset
      const name = document.createElement('span')
      name.className = 'name'
      name.textContent = file.dataset.name
      // создаем блок для хранения текста фала и записываем в него контент
      const text = document.createElement('pre')
      text.className = 'file-text'
      text.textContent = file.textContent

      // очищаем файл от текста
      file.textContent = ''

      // вставляем текст, имя и иконку
      file.insertAdjacentElement('afterbegin', text)
      file.insertAdjacentElement('afterbegin', name)
      file.insertAdjacentElement('afterbegin', icon)

      // ловим даблклик
      file.addEventListener('click', evt => {
        if (evt.detail >= 2) {
          // убираем selected у остальных файлов
          files.forEach(el => {
            el.classList.remove('selected')
          })
          // добавляем selected конкретному файлу
          file.classList.add('selected')
          // предпросмотр файла
          if (options.filePreview) {
            console.log(text.textContent)
            if (!document.querySelector(options.filePreview)) {
              console.error('tree: wrong file preview selector')
            }
            document.querySelector(options.filePreview).textContent = `${
              options.paths ? 'path: ' + file.dataset.path : ''
            } 
             ${text.textContent}`
          }
        }
      })

      // добавляем обработчик контекстного меню и передаем селектор родителя
      file.addEventListener('contextmenu', event => contextMenu(event, '.file'))

      // генерируем пути
      generatePath(file)
    })
  }

  foldersInit()
  filesInit()
}

// инициализация древа
treeInit('.my-tree', {
  edit: true,
  paths: true,
  filePreview: '.tree-file-preview-out',
})

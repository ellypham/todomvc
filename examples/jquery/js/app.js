/*global jQuery, Handlebars, Router */

Handlebars.registerHelper('eq', function (a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});

// 13 is the key number for the enter key
const ENTER_KEY = 13;
// 27 is the key number for the escape key
const ESCAPE_KEY = 27;

// utils or the todo app
const util = {
  // creates a unique id number and stores it in the uuid variable
  uuid: function () {
    /*jshint bitwise:false */
    let i, random;
    let uuid = '';

    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return uuid;
  },
  // pluralizes a word if the count is greater than 1
  pluralize: function (count, word) {
    return count === 1 ? word : word + 's';
  },
  // a function to store todos in local storage
  store: function (namespace, data) {
    if (arguments.length > 1) {
      return localStorage.setItem(namespace, JSON.stringify(data));
    } else {
      const store = localStorage.getItem(namespace);
      return (store && JSON.parse(store)) || [];
    }
  }
};

// App is the entire application object for our todo application
const App = {
  // initiates the to do app
  init: function () {
    this.todos = util.store('todos-jquery');
    this.todoTemplate = Handlebars.compile(document.getElementById('todo-template').innerHTML); 
    this.footerTemplate = Handlebars.compile(document.getElementById('footer-template').innerHTML);
    this.bindEvents();
    // routers for the filters of the todos (all, active, completed)
    new Router({
      '/:filter': function (filter) {
        this.filter = filter; // sets the filter to the filter value that is passed in
        this.render(); //calls this.render() method to render the todos in the UI
      }.bind(this) // binds to this.App
    }).init('/all'); // initiate with the filter set to all
  },
  // Adds event handlers and links them to their methods and binds the methods to the Application
  bindEvents: function () { //bind('provided value') => this keyword set to the provided value
    document.getElementById('new-todo').addEventListener('keyup', this.create.bind(this));
    document.getElementById('toggle-all').addEventListener('change', this.toggleAll.bind(this));
    document.getElementById('footer').addEventListener('click', (e) => {
      if(e.target.matches('#clear-completed')) {
        this.destroyCompleted();
      }                                                 
    });

    const toDoListEl = document.getElementById('todo-list');
    toDoListEl.addEventListener('change', (e) => {
      if(e.target.matches('.toggle')) {
        this.toggle(e);
      }
    });
    toDoListEl.addEventListener('dblclick', (e) => {
      if(e.target.matches('label')) {
        this.edit(e);
      }
    });
    toDoListEl.addEventListener('keyup', (e) => {
      if(e.target.matches('.edit')) {
        this.editKeyup(e);
      }
    });
    toDoListEl.addEventListener('focusout', (e) => {
      if(e.target.matches('.edit')) {
        this.update(e);
      }
    });
    toDoListEl.addEventListener('click', (e) => {
      if(e.target.matches('.destroy')) {
        this.destroy(e);
      }
    });
  },
  render: function () { //renders the filtered todos
    const todos = this.getFilteredTodos(); // gets the filtered todos and stores them in the todos variable
    document.getElementById('todo-list').innerHTML = this.todoTemplate(todos); // renders the todoTemplate to the todo-list element
    if(todos.length > 0) { // if todos length is greater than 0, display the main element
      document.getElementById('main').style.display = 'block';
    } else { 
      document.getElementById('main').style.display = 'none'; // if todos length is less than 0, do not display the main element
    }
    if(this.getActiveTodos().length === 0) { // if active todos is equal to 0, set the checked input with the id name of toggle-all to true
      document.getElementById('toggle-all').checked = true;
    } else { //if active todos is anything but equal to 0, set the checked input with the id name of toggle-all to false
      document.getElementById('toggle-all').checked = false;
    }
    this.renderFooter(); // calls renderFooter function
    document.getElementById('new-todo').focus(); // focuses the cursor on the input where new todo is added
    util.store('todos-jquery', this.todos); // stores the todos in local storage
  },
  renderFooter: function () {
    const todoCount = this.todos.length; // get the length of the todos and stores in the todoCount variable
    const activeTodoCount = this.getActiveTodos().length; //get length of active todos and store in activeTodoCount variable
    const template = this.footerTemplate({ // calls the footerTemplate function and stores variables in the object and stores in template variable
      activeTodoCount: activeTodoCount,
      activeTodoWord: util.pluralize(activeTodoCount, 'item'),
      completedTodos: todoCount - activeTodoCount,
      filter: this.filter
    });

    const footerEl = document.getElementById('footer'); // gets the footer elements and stores in footerEl variable
    if(todoCount > 0) { // if todoCount is greater than 0, display the footer template
      footerEl.innerHTML = template;
      footerEl.style.display = 'block';
    } else { // else, don't display the footer element
      footerEl.style.display = 'none';
    }
  },
  toggleAll: function (e) {
    const isChecked = e.target.checked; // store the value of e.target.checked (true) in isChecked variable

    this.todos.forEach(function (todo) { //loop through the todos
      todo.completed = isChecked; // set the proerty of completed on each todo to the isChecked value (true)
    });

    this.render(); //calls this.render() method to render the todos in the UI
  },
  getActiveTodos: function () {
    return this.todos.filter(function (todo) { //filters through the todos and find the todos that are active
      return !todo.completed; //this gets the opposite of the todo.completed value
    });
  },
  getCompletedTodos: function () {
    return this.todos.filter(function (todo) { //filters through the todos a
      return todo.completed; // and returns todo that are completed
    });
  },
  getFilteredTodos: function () { // gets the todos that are filtered
    if (this.filter === 'active') { // if the filter property is equal to 'active'
      return this.getActiveTodos(); // return the todos that are active by calling the this.getActiveTodos() method
    }

    if (this.filter === 'completed') { // if the filter is equal to 'completed'
      return this.getCompletedTodos(); // return the todos that are completed by calling the this.getCompletedTodos() method
    }

    return this.todos; //return the todos (current state of todos)
  },
  destroyCompleted: function () {
    this.todos = this.getActiveTodos(); // calls the this.getActiveTodos() method and stores it into this.todos (current state of todos)
    this.filter = 'all'; // set the filter back to "all"
    this.render(); // //calls this.render() method to render the todos in the UI
  },
  // accepts an element from inside the `.item` div and
  // returns the corresponding index in the `todos` array
  indexFromEl: function (el) {
    const id = el.closest('li').dataset.id; //gets the dataset id and stores it in the variable id
    const todos = this.todos; //stores the current state of todos in todos variable
    let i = todos.length; // stores the current length of todos in the variable i

    while (i--) { // iterates through array by counting down from i to 0
      if (todos[i].id === id) { //if the id is equal to id
        return i; // return the current value of i
      }
    }
  },
  create: function (e) { 
    const input = e.target; // stores e.target value in the input variable
    const val = input.value.trim(); // stores the value of the input and removes any extra spacing and stores in the val variable

    if (e.which !== ENTER_KEY || !val) { //if the enterkey has any been pressed or if there is no value, do nothing
      return;
    }

    this.todos.push({ // push a todo with the property and values id, title and completed
      id: util.uuid(),
      title: val,
      completed: false
    });

    input.value = ''; //clear the input

    this.render(); //calls this.render() method to render the todos in the UI
  },
  toggle: function (e) {
    const i = this.indexFromEl(e.target); //calls the this.indexFromEl to find the index, stores index in the variable i
    this.todos[i].completed = !this.todos[i].completed; //sets the targetted to do property of completed to the opposite of its current value (true or false)
    this.render(); //calls this.render() method to render the todos in the UI
  },
  edit: function (e) {
    const todoLi = e.target.closest('li'); //stores the li element in the todoLi variable, which is the the todo to be edited
    todoLi.classList.add('editing'); // adds a class of 'ediiting' to the li element
    const input = todoLi.querySelector('.edit'); // finds the element with the class name of edit and stores it in the input variable
    input.focus(); //sets focus to the input, where the cursor is
  },
  editKeyup: function (e) {
    const todo = e.target; //stores the e.target into todo variable
    if (e.which === ENTER_KEY) { //if the enter key is pressed, remove the focus (cursor) off of the todo that is edited
      todo.blur();
    }

    if (e.which === ESCAPE_KEY) { //if the escape key is pressed, set the dataset with the name of abort to true
      todo.dataset.abort = true;
      todo.blur(); //remove the focus (cursor) off of the todo that is edited
    }
  },
  update: function (e) {
    const el = e.target; //stores the e.target (input element) into the todo variable
    const val = el.value.trim(); // stores the value of the input into the variable val and removes any spaces

    if (!val) { //if there is no value in the input to be edited
      this.destroy(e); //remove the todo
      return;
    }

    if (el.hasAttribute('abort')) { //if the element has a dataset of abort
      el.dataset.abort = false; //set the dataset of abort to false
    } else {
      this.todos[this.indexFromEl(el)].title = val; //set the todo to the new value
    }

    this.render(); //calls this.render() method to render the todos in the UI
  },
  destroy: function (e) {
    this.todos.splice(this.indexFromEl(e.target), 1); //removes the todo from the todos array using the splice method and the index of the todo
    this.render(); //calls this.render() method to render the todos in the UI
  }
};

App.init();
const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

//Get Todos API
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                SELECT 
                    id, todo, priority, status, category, due_date AS dueDate
                FROM 
                    todo 
                WHERE 
                    status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
                SELECT
                    id, todo, priority, status, category, due_date AS dueDate
                FROM
                    todo
                WHERE
                    priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                    SELECT
                        id, todo, priority, status, category, due_date AS dueDate
                    FROM
                        todo
                    WHERE
                        priority = '${priority}' AND status = '${status}';`;
          data = await db.all(getTodosQuery);
          response.send(data);
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasSearch(request.query):
      getTodosQuery = `
            SELECT
                id, todo, priority, status, category, due_date AS dueDate
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data);
      break;

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                    SELECT
                        id, todo, priority, status, category, due_date AS dueDate
                    FROM
                        todo
                    WHERE
                        category = '${category}' AND status = '${status}';`;
          data = await db.all(getTodosQuery);
          response.send(data);
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
                SELECT
                    id, todo, priority, status, category, due_date AS dueDate
                FROM
                    todo
                WHERE
                    category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
                    SELECT 
                        id, todo, priority, status, category, due_date AS dueDate
                    FROM
                        todo
                    WHERE
                        category = '${category}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data);
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = `
            SELECT 
                id, todo, priority, status, category, due_date AS dueDate
            FROM
                todo;`;
      data = await db.all(getTodosQuery);
      response.send(data);
  }
});

//Get Todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT
            id, todo, priority, status, category, due_date AS dueDate
        FROM
            todo
        WHERE
            id = ${todoId};`;
  const getTodoDetails = await db.get(getTodoQuery);
  response.send(getTodoDetails);
});

//Get Duedate API
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getDateQuery = `
            SELECT
                id, todo, priority, status, category, due_date AS dueDate
            FROM
                todo
            WHERE
                due_date = '${newDate}';`;
    const dateDetails = await db.all(getDateQuery);
    response.send(dateDetails);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Add Todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoQuery = `
                    INSERT INTO todo(id, todo, priority, status, category, due_date)
                    VALUES(
                        ${id},
                        '${todo}',
                        '${priority}',
                        '${status}',
                        '${category}',
                        '${newDueDate}'
                    );`;
          await db.run(addTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//Update Todo API

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;

  const previousTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodo;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `
                    UPDATE
                        todo
                    SET
                        todo = '${todo}',
                        priority = '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}'
                    WHERE
                        id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `
                    UPDATE
                        todo
                    SET
                        todo = '${todo}',
                        priority = '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}'
                    WHERE
                        id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodo = `
                UPDATE
                    todo
                SET
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE
                    id = ${todoId};`;
      await db.run(updateTodo);
      response.send("Todo Updated");
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `
                    UPDATE
                        todo
                    SET
                        todo = '${todo}',
                        priority = '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}'
                    WHERE
                        id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodo = `
                    UPDATE
                        todo
                    SET
                        todo = '${todo}',
                        priority = '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}'
                    WHERE
                        id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//Delete Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM
            todo
        WHERE
            id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

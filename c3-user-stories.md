Please edit this template and commit to the master branch for your user stories submission.  
Make sure to follow the _Role, Goal, Benefit_ framework for the user stories and the _Given/When/Then_ framework for the Definitions of Done! You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-21w2-intro-to-se/project/checkpoint-3).

## User Story 1

As a student, I want to be able to see class averages of courses within a specific department in ascending order.

#### Definitions of Done(s)

Scenario 1: Student successfully performs the query.  
Given: The student has selected the "courses" dataset in the UI.  
When: The student FILTERS courses for a particular department and SELECTS the course average, and the course number, ORDERing by course average in ascending order.  
Then: The UI displays a table with rows containing course number and their corresponding class averages.

Scenario 2: Error message occured. Student did not perform a proper query.
Given: The student has selected the "coursesOOPS" dataset in the UI. However, courseOOPS dataset is not already added.
When: The student FILTERS courses for a particular department and SELECTS the course average, and the course number, ORDERing by course average.  
Then: The UI acknowledges the insight error by saying the course dataset ID does not exist.

## User Story 2

As a student, I want to see what datasets I can choose from so that I can start making queries in the application.

#### Definitions of Done(s)

Scenario 1: Student asks for available datasets.
Given: There's at least 1 dataset added before.
When: The student sends a command asking for a list of available datasets.
Then: The UI returns a table showing all the available datasets and their type (courses/rooms).

Scenario 2: Student asks for available datasets, but there are none added in the backend
(this is the closest we can get to an "error" because they don't exist for listDatasets)
Given: There's no dataset added before.
When: The student sends a command asking for a list of available datasets.
Then: The UI displays something indicating that there are no dataset available to be queried from.

## Others

You may provide any additional user stories + DoDs in this section for general TA feedback.  
Note: These will not be graded.

# Genetic Optimizer

This is a JavaScript library that implements a genetic optimization algorithm. Genetic algorithms (GAs) attempt to find the optimal value of a function using a technique modelled after the biological process of natural selection. Unlike many other optimization methods which only work on specific kinds of functions (e.g., continuous, differentiable, etc.), GAs make no assumptions about the behavior of the function that they're optimizing. Genetic algorithms are well suited to combinatorial optimization problems, especially those where the variables interact in a complicated way.

While GAs cannot generate a provable optimum (although they may find the optimum value), they are useful when you want to find a pretty good solution quickly.

## Getting Started

To use GeneticOptimizer, you write a simple object to represent your objective function and pass it to the optimizer. GeneticOptimizer includes a handful of built-in functions to make this easier. In many cases, all you will need to do is write the objective function itself and set a few options.

    myFunction = {
        variableCount: 3,
        variableUBound: [10, 10, 10],
        getValue: function (x) { return x[0] + x[1] + x[2]; },
        getRandomIndividual: GeneticOptimizer.getRandomIndividualBasic,
        mutate: GeneticOptimizer.mutateBasic,
        crossover: GeneticOptimizer.crossoverMerge
    };

    myOptimizer = new GeneticOptimizer({
        combinatorialFunction: myFunction,
        objective: "maximize"
    });

    myOptimizer.optimize;

### Required settings for your objective function

GeneticOptimizer can attempt to optimize any object that implements the following properties and methods.

#### variableCount

The number of variables in your objective function. GeneticOptimizer's built-in functions assume that all variables are integers.

    myFunction.variableCount = 3;

#### variableUBound

An array the represents the upper bound of each variable. The lower bound for all variables is assumed to be zero.

    myFunction.variableUBound = [17, 14, 3];

#### getValue(x)

The actual objective function. x[] is an array of integers, and the function must return a single numeric value.

    myFunction.getValue = function (x) {
        return x[0] + x[1] + x[2] - x[1] * (x[0] + x[2]);
    };

#### getRandomIndividual

This function is called repeatedly to create the initial random population that the optimizer evolves over successive generations. After GeneticOptimizer creates the initial population, it never calls this function again. GeneticOptimizer includes a default implementation (`GeneticOptimizer.getRandomIndividualBasic`) that selects a random value for each x[i] between 0 and its upper bound.

    myFunction.getRandomIndividual = GeneticOptimizer.getRandomIndividualBasic;

#### mutate

Takes a given individual and alters it. The mutation operator is modeled after biological mutation, and in a genetic algorithm, it serves to broaden the search space. GeneticOptimizer includes a built-in mutation function that replaces one variable with a random value between 0 and its upper bound.

    myFunction.mutate = GeneticOptimizer.mutateBasic;

#### crossover

Takes two parent individuals (arrays of integers) and combines them to produce two new individuals that combine the characteristics of both parents. In a biological sense, this function mimics generating two offspring from two parents. By combining the characteristics of two fit individuals, GeneticOptimizer tries to find even better individuals. GeneticOptimizer includes three standard crossover functions, and it's worth trying each of them to see which one gives you the best results:

* __singleCrossover__: chooses a random location and splices the two parents together so that each offspring starts with the beginning of one parent and ends with the end of the other. For example, if the two parents are 1-1-1-1-1 and 2-2-2-2-2, the two offspring might be 1-1-2-2-2 and 2-2-1-1-1. This is a good option if your variables are in a meaningful order, x[0] represents a starting point (like the most significant value) and x[length - 1] represents an ending point (like the least significant value).
* __doubleCrossover__: just like singleCrossover, except that the crossover performs two splices, so in our example above, the offspring might look like 1-2-2-1-1 and 2-1-1-2-2. This is a good option if your variables are in a meaningful order but the starting point is arbitrary. In essence, it treats the variables as if they're part of a ring structure where x[0] is adjacent to x[length - 1].
* __mergeCrossover__: takes randomly from each parent, so the offspring from a merge crossover might look like 1-2-1-2-2-1-2 and 2-1-2-1-1-2-1. This may be a good choice if your variables are not in a meaningful order.

    myFunction.crossover = GeneticOptimizer.crossoverSingle;

### GeneticOptimizer options

GeneticOptimizer has a handful of options that you can change to affect the optimization. In practice, you should experiment with several values until you find ones that give you the right balance of speed and solution quality.

* __populationSize__ (integer; default: 100): The size of the population that is evolved over time. In general, a larger population size will take longer to run but will explore a broader range of possibilities.
* __iterationLimit__ (integer; default: 1000): The maximum number of iterations that the algorithm will try. Each iteration represents a successive generation of the population, where individuals are selected for breeding and produce offspring which are then evaluated for fitness.
* __timeLimit__ (integer; default: 5000): the maximum running time of the algorithm in milliseconds. It does not include the time taken by postprocessing.
* __mutationProbability__ (float; range 0.0 - 1.0; default: 0.02): the probability that an individual in a generation will have a mutation (as implemented by the `mutate` function. Higher mutation values tend to broaden the search by introducing new variations into the population. Lower values lead the algorithm to converge to a solution more quickly.
* __crossoverProbability__ (float; range 0.0 - 1.0; default: 0.6): the probability that a pair of individuals selected for breeding will produce offspring using the `crossover function`. Otherwise, the two selected individuals pass to the next generation unmodified, except potentially by mutation (see above).
* __improvementIterationLimit__ (integer; default: 500): the algorithm will terminate if it has gone for this many iterations without making any progress toward a better solution.
* __combinatorialFunction__ (object; default: null): The function to be optimized (see above).
* __objective__ (string; "maximize" or "minimize"; default: "maximize") Whether the function should be maximized or minimized.
* __statusCallbackInterval__ (integer; default: 1): How often to call the status callback function if present (see below). A value of 1 means that it will be called every generation. A value of 2 means that it will be called every other generation, and so on. GeneticOptimizer will also call the function whenever it finds an improved solution.

### Getting status updates from the optimization

Since running a genetic optimization can be time-consuming, GeneticOptimizer has callback hooks (set on the options object that is passed to GeneticOptimizer when it is initialized) that give you updates on the algorithm's progress. It is called every _statusCallbackInterval_ iterations or whenever an improved solution (i.e., an _incumbent_) is found.

The status callback function takes one argument, a status object with the following properties:

* __iteration__ (integer): the current iteration (generation) number for the algorithm
* __newIncumbent__ (boolean): did the algorithm find an improved solution?
* __populationMin__ (float): the minimum value of the objective function within the current population
* __populationMax__ (float): the maximum value of the objective function within the current population
* __populationMean__ (float): the minimum value of the objective function across all members of the current population

The examples use the status callback function to create graphs that show the progress of the solution.

    myOptimizer = new GeneticOptimizer({
        combinatorialFunction: myFunction,
        objective: "maximize",
        statusCallbackInterval: 5,
        statusCallback: function (status) {console.log(status);}
    });


## Advanced topics: writing custom behaviors and operators

While GeneticOptimizer can solve many problems using nothing but the built-in functions, other problems have special characteristics that benefit from exercising more control. The travelling salesman example gives a practical example of how and why you might do this.

### Writing your own initial population generator

You can write your own function to control how GeneticOptimizer creates the starting population. One common reason to do this is to avoid invalid combinations of variables. In the travelling salesman example, each variable represents a location on a tour, each of which must be visited exactly once, so we created a custom getRandomIndividual function that gives a randomly selected, but valid, tour.

When writing your generator function, you should take care that it covers the solution space completely and evenly. In other words, the function should be able to generate all possible valid individuals with equal probability.

Here is an example of a function that generates new individuals where each variable is either zero or its upper bound. This is likely to be a very poor generation function, but it does illustrate how they work.

    myFunction.getRandomIndividual = function () {
        var i, result;

        result = [];
        for (i = 0; i < this.variableCount; i++) {
            if (Math.random() < 0.5) {
                result[i] = 0;
            } else {
                result[i] = this.variableUBound[i];
            }
        }

        return result;
    };

### Writing your own mutation function

A mutation function takes an existing individual and changes it in a random way. You may want to write your own mutation function if there are combinations of values x[] that are not valid. By writing your own mutation function, you can ensure that all mutations yield a valid individual. In the travelling salesman example, each variable represents a location on a tour, and we must visit each location exactly once.

You can also use the mutation function to introduce a periodic heuristic to improve the solution. For example, you might use it to run a local search on randomly selected individuals from time to time.

In the travelling salesman problem, the mutation function swaps two locations in the tour.

    myFunction.mutate = function (x, length, uBound) {
        var i, j, t;

        // swaps two locations at random

        i = Math.floor(Math.random() * length);
        j = Math.floor(Math.random() * length);
        t = x[i];
        x[i] = x[j];
        x[j] = t;
    };

### Writing your own crossover function

You may want to write your own crossover function, especially if there are combinations of values x[] that are not valid. By writing your own crossover function, you could ensure that all offspring remain valid. In the travelling salesman example, each variable represents a location on a tour, and we must visit each location exactly once, so we wrote a custom crossover function to preserve this characteristic.

While the travelling salesman problem's crossover function is somewhat involved, here is a simpler example which always crosses over at exactly the midpoint.

    myFunction.crossover = function (x1, x2, length) {
        var i, crossPoint, t;

        crossPoint = length >>> 1;

        for (i = crossPoint; i < length; i++) {
            t = x1[i];
            x1[i] = x2[i];
            x2[i] = t;
        }
    };

### Improving your solution with postprocessing

Genetic algorithms are often very good at finding a nearly optimal solution, so sometimes it makes sense to explore solutions in the neighborhood of the optimum to see if better solutions are nearby. If your function includes a postprocessing routine, GeneticOptimizer will call it at the end of the optimization to attempt to improve the solution. The travelling salesman example uses TwoOpt (a well-known heuristic for improving travelling salesman tours) as a postprocessing step.
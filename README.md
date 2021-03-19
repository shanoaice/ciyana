# Ciyana

Ciyana is a database designed with parallelism in mind. It also uses highly efficient data structures to store its data on disk (with time complexity of `O(1)`) so its performance is good.

## Features

-   Internal parallism using worker threads
    -   Using efficient event-based lock to achieve atomicity
-   Compact and efficient hash-based key table
-   Optional value compression using `lz-string` (`string` value only)

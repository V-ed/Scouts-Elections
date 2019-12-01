# Scouts-Elections

## Introduction

This static website is a program that lets our Scouts group create Elections to determine which leaders will be in our subgroups.

As we don't know how many kids will be there on Election day (absences...), this program allows for configurations on setup and when ready, shows the voting page with all the candidates entered on setup with a customizable number of votes. That voting page repeats until all the voters have went through.

Since we don't want to know who voted for who, there is no need to "register", but we need to confirm if the kid really voted or not, and prevent him from voting more than once (which may skew the results).
Therefore, after a voter's vote, an overlay shows on the voting page, preventing any further actions until the special input is pressed, which will reset the page to allow for the next voter to actually vote.

There is two way to trigger that special input :
- When using a keyboard, you can use the current default keybinding of `space`
- When having a touchscreen, you also have the ability to long press the top half portion of the overlay
  - This input is only available in the overlay that appears when someone voted, and can therefore not be triggered in the voting page

Whenever that special input is used, a toast notification shows up for a brief moment showing how much votes remains, to keep track of the progress of the current voting session.

That toast notification also has a button to skip remaining voters, in case you miscalculated the number of voters or simply want to skip the remaining ones.
If skipped, the database will contain this information, which means that when loading this database the results will be shown right away (after entering the password, of course).

## Setup page

In the setup page, validations are used to prevent any bad inputs on setup (empty number of voters, empty candidate name, number of votes higher than the number of candidates *(which doesn't make sense, as every candidates would be voted for...)*, etc).

The number of votes is setup to be a minimum and a maximum : you can give the voters between `x` and `y` votes, which allows them for example to vote between 3 to 5 candidates, or even between 0 and 5 candidates, which would mean they could skip their votes if desired.
If there is the need to force a number of votes (for example, the voters *need* to vote 4 times), simply set the minimum and the maximum to the same number, and this case will be fulfilled.

There is also a configuration option that allows the voters to vote multiple times for the same candidate : simply toggle it on or off (off by default).
This toggle does not affect the number of votes logic described above.

The name of the database is the name that will be given to the file if you want to download the database at the end.
Validations rules on it prevents you from entering a filename that wouldn't be accepted by Windows systems.

## Voting

After setup, at any point, if the page gets reloaded or closed, the database will be downloaded in an unfinished state, allowing you to return to the state you were in.

This allows some sort of protection in case a smart kid decides he wants to press Alt+F4 to mess up stuff.

In the case you want to disable that, there is a checkbox in the setup page that is checked by default - simply uncheck it and the database won't download automatically.
Even with the automatic download disabled, you will still be able to download the database manually in the end if desired.

## Results

Before showing results, a password is asked to prevent kids from viewing the results by accident.
The password can be set in the setup page, and is optional : if you don't set any password, when the last voter has finished voting, the overlay will show and going to the next voter will simply show the results directly.

**Please note that the password is not encrypted** and is simply a bridge between the voters and the scout leaders.
If you used this application before you could set the password, and you try to load the database, the password still defaults to `VL` so you don't get too lost.

The results shown at the end are sorted by number of votes, meaning the most voted candidate will be on top and the lowest voted candidate will be at the bottom.

The rows are clickable, which highlights the candidates (in a cycle of *unselected*, *pre-selected* and *selected*), allowing for discussions with other maintainers.

The button to return to the homepage currently simply reloads the page, as this was an easier way of resetting the program's state at the time. This behavior is something I want to change, which you can follow my progress in [#43][reset-state].

## Miscellaneous

All the text in here is in French, since our group is French-based.
Code is in English because code should always be in English.

[reset-state]: https://github.com/V-ed/Scouts-Elections/issues/43

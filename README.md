# Scouts-Elections

This static website is a program that lets our Scout group create Elections to determine which leaders will be in our subgroups.

As we don't know how many kids will be there on Election day (absences...), this program allows for configurations on setup and when ready, shows the voting page with all the candidates entered on setup with a customizable number of votes. That voting page repeas until all the voters have went through.

Since we don't want to know who voted for who, there is no need to "register", but we need to confirm if the kid really voted or not, and prevent him from voting more than once (which may skew the results).
Therefore, after a voter's vote, an overlay shows on the voting page, preventing any further actions, until the special keyboard input is pressed, which would reset the page to allow for the next voter to actually vote.
Currently, the keyboard input to go to the next is `spacebar`.
Also, whenever that keyoard input is used, a toast notification shows up for a brief moment showing how much votes remains, to keep track of the progress of the current voting session.

In the setup page, validations are used to prevent any bad inputs on setup (empty number of voters, empty candidate name, number of votes higher than the number of candidates *(which doesn't make sense, as every candidates would be voted for...)*, etc).

Currently, the number of votes is absolute and a voter cannot put two votes on the same candidate.
I may add a configuration option later on to allow that, but this wasn't our needs and was therefore not worked on.

The name of the database, on the setup page, is the name that will be given to the file if you want to download the database at the end.
Validations rules on it prevents you from entering a filename that wouldn't be accepted by Windows systems.

Before showing results, a password is asked to prevent kids from viewing the results by accident. The password is currently hardcoded to `VL` ("**V**ieux-**L**oups"), but may be switched to a setup-based password selection (view #12).
The results shown at the end are sorted by number of votes, meaning the most voted candidate will be on top and the lowest voted candidate will be at the bottom.
Rows are clickable, which highlights the candidates, allowing for discussions with other maintainers.

All the text in here is in French, since our group is French-based.
Code is in English because code should always be in English.

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

Whenever that special input is used, a toast notification shows up for a brief moment showing how much voters remains, to keep track of the progress of the current voting session.

That toast notification also has a button to skip remaining voters, in case you miscalculated the number of voters or simply want to skip the remaining ones.
If skipped, the database will contain this information, which means that when loading this database the results will be shown right away (after entering the password, of course).

There is also a way to spread the election between multiple devices to make that election go faster (multiple kids at the same time) : to learn more about this functionality, please [scroll down to the relevant section](#sharing-elections-between-multiple-devices).

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

*If you used this application before you could set the password (you probably didn't ;) ), and you try to load the database, the password still defaults to `VL` so you don't get too lost.*

The results shown at the end are sorted by number of votes, meaning the most voted candidate will be on top and the lowest voted candidate will be at the bottom.

The rows are clickable, which highlights the candidates (in a cycle of *unselected*, *pre-selected* and *selected*), allowing for discussions with other maintainers.

The button to return to the homepage currently simply reloads the page, as this was an easier way of resetting the program's state at the time. This behavior is something I want to change, which you can follow my progress in [#43][reset-state].

## Sharing elections between multiple devices

The elections can be shared between multiple devices to allow for a single election to be spread across multiple devices.
This is especially useful when there is alot of voters and the time to make everyone vote may be limited, since you can make multiple voters input their votes at the same time.

To use this functionality, you simply need one device that creates the setup for the election, which would then use the dedicated `Créer comme Élection Partagée` button.
A checkmark is shown next to this button to confirm if you have access to my server that makes this functionality possible.
For more information about this server, please consult [this page that explains why it is necessary][shared-election-server-info].

When the shared election is created, a code will be generated and shown on the creator's screen, which you can now use on other devices to join the created election : you simply need to use the button to join this election on the home page, input the code that was shown on the creator's screen (share it between yourselves however you want), and all the data will be fetched and the election will start as usual.

Be aware that when voting, requests will be sent to the server to keep it up to date / in synchronization with other devices, so that you don't vote 20 times on each device if you had 20 voters to begin with.
When doing a request, a loading indicator will be shown to indicate that a request is occurring : the only exception for this is when a voter submits their vote(s), as they might be confused as to why there was something that appeared on screen for no apparent reason.

The functionality to skip the remaining voters allows you to skip the election for everyone, not only the device that it was inputted on.
A warning is shown when using this functionality in the shared election context, to let you truly decide the flow of your own shared election.
If you skip the shared election, no *new* voters will be available to input their vote(s) : however, devices that already had a voter on it will still be able to send their vote(s).

When no more "seats" are available (when every voter has voted or there are voter that are currenty voting), a page will be shown on devices that have no voters left that lets you know when there is no more voters remaining : it will verify automatically every 30 seconds, or you can manually verify yourself by pressing the button dedicated for it.
This page allows you to bypass the remaining voters if that's what you need (in case of issues, such has loss of Internet connectivity, for example) - this option however does not delete or skips the election, it simply shows the data that your device currently has.
This page also allows you to send a request to delete the data on the server once the election is over.

Finally, after 24 hours of inactivity (no one joins the shared election, send a vote request, fetches the results, etc), the data will be automatically deleted from my server.

During the whole proceess, errors are handled and if you lose Internet connection, you will, most of the time, have the option to fallback to a local election instead.
This option is there mostly to prevent your data from being lost, so that you can handle problems more easily.
These errors are explained when they happen, and their text will be red to signal that it was an error.

## Miscellaneous

All the text in here is in French, since our group is French-based.
Code is in English because code should always be in English.

## Author

- Guillaume Marcoux ([V-ed](https://github.com/V-ed)) - Owner

See also the list of [contributors](https://github.com/V-ed/Scouts-Elections/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details

[reset-state]: https://github.com/V-ed/Scouts-Elections/issues/43
[shared-election-server-info]: https://v-ed.github.io/Scouts-Elections/election-partagee-info.html

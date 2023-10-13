#0. Environment Setup

Ensure our NodeBB version and redis are available on your computer. Make sure you have a NodeBB account setup. If you have issues, follow the instructions here: https://cmu-313.github.io/projects/P1/installation/mac/#installing-nodebb 

#1. Register and Log In

Register and Log into NodeBB account

#2. Create and view new anonymous topic

The user is able to create a new topic as usual, but also has the option to make the topic anonymous by checking the anonymous option.

The topic will display without a user icon and “Anonymous” as the topic author.

The topic can be edited and deleted like a normal topic by the original topic author. However, once a non-anonymous topic is created, it cannot be changed to be an anonymous topic, and vice-versa. 

#3. Create and view new anonymous post

A post is a reply to a topic, and all the anonymous posting functionality is the same as for the topic.



For future development:
For anonymous posts, the tooltip (which appears on hover on a post) should be updated as well so the author name is not revealed.
When looking at latest posts by a user, the anonymous posts should not show up.
After a post is created, users should be able to update its anonymous status


Link/description of where our automated tests can be found:

https://github.com/CMU-313/fall23-nodebb-slate/pull/33 (file path: test/posts.js)

- Added tests to determine the functionality of the anonymous field. This was done by checking how the system reacts to different types and values of the anon field in the posts and topics objects, such as true, false, and non boolean and none types.
These tests align with the functional requirements and expectations for the “anon” field. Additionally, we tested for type checking to ensure that anon field was in fact a boolean.
- The first test checks whether the system correctly sets the "anon" field to true when creating a post.
It retrieves the post data and verifies that the "anon" field is of boolean type and has the value true.
This test validates the system's ability to handle the "anon" field when it is set to true.

- The second test checks whether the system properly rejects the creation of a post when the "anon" field is set to a non-boolean value ("invalid").
It captures the expected error message and ensures that the system behaves as expected by throwing an error with the correct message.
This test confirms that the system correctly validates and rejects invalid "anon" values.

- The third test verifies whether the system correctly sets the "anon" field to false when creating a post.
Similar to the first test, it retrieves the post data and checks if the "anon" field is of boolean type and has the value false.
This test ensures that the system correctly handles the "anon" field when it is set to false.

https://github.com/CMU-313/fall23-nodebb-slate/pull/31 (file path: tests/controllers.js) 
- Tests that the composer route properly handles new topics created where anon field is true in composer.ts and type checks that the anon field is a boolean
- anon: The anon field is set to true, indicating that this topic should be created as an anonymous topic.
- Before making the POST request to create the topic, there's a check to validate whether the anon field is a boolean. This check ensures that the anon field has been set correctly. If the anon field is not a boolean (i.e., it's not true or false), it raises an error indicating that the "anon" field must be a boolean.
- The test is essentially testing the system's ability to create a topic with specific properties, including the "anon" field, and ensuring that the "anon" field is correctly set as a boolean. This is an important validation step to confirm that the system handles the creation of anonymous topics correctly.

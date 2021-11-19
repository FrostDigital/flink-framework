# Database repos

Repos, or repositories, are responsible for interacting with the mongo db.

Repos _must_ be created in `/src/repos`.

By placing it here Flink will recognize it as a repo, instantiate it and inject the connected database.

Flink encourages one repo per collection, in fact the collection name will by default be derived from the filename. For example `AppUserRepo.ts` will use collection name `app_user`.

## Create repo based on `FlinkRepo`

Flink provides `FlinkRepo` which is a base class with a standard set of utilities.

```typescript
import { FlinkRepo } from "@flink-app/flink";
import { Ctx } from "../Ctx";
import { User } from "../schemas/User";

class UserRepo extends FlinkRepo<Ctx, User> {
  getUserByEmail(email: string): Promise<User | null> {
    return this.collection.findOne({
      email,
    });
  }
}

export default UserRepo;
```

In above example there is only one implemented method which is specific to this application.

The base class `FlinkRepo` provides a bunch of useful methods. You could for example use:

```typescript
// Get single user or return null if it does not exist
await userRepo.getById("useridhere");

// Create user, will by default require input of User minus the _id
await userRepo.create({ email: "alice@frost.se", name: "Alice" });

// ...but type can be set like this to further customize it
await userRepo.create<{ email: string; name: string }>({
  email: "alice@frost.se",
  name: "Alice",
});
```

## Create custom repo

You can easily roll your own, but you need to make sure that the repo has same naming convention and that is has a constructor that accepts collection name and database object.

```typescript
class CustomRepo {
  constructor(private collectionName: string, private db: Db) {}

  // Your repo methods here....
}

export default CustomRepo;
```

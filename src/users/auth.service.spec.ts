import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "./users.service";
import { User } from "./user.entity";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("AuthService", () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  beforeEach(async () => {
    // mock users svc
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it("can create and istance of auth svc", async () => {
    expect(service).toBeDefined();
  });

  it("creates a new user with a salted hashed password", async () => {
    const user = await service.signUp("test@test.com", "657ytfjhy");
    expect(user.password).not.toEqual('657ytfjhy"');
    const [salt, hash] = user.password.split(".");
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it("throws error when user signs up with email already in use", async () => {
    await service.signUp("asdf@asdf.com", "asdf");
    await expect(service.signUp("asdf@asdf.com", "asdf")).rejects.toThrow(
      BadRequestException
    );
  });

  it("throws an error when user is not found when signing in", async () => {
    await expect(service.signIn("uytuyt@uyyuyt.com", "ytrytr")).rejects.toThrow(
      NotFoundException
    );
  });

  it("throws if an invalid password is provided", async () => {
    await service.signUp("amygawd@asdf.com", "awwseed");
    await expect(service.signIn("amygawd@asdf.com", "passsss")).rejects.toThrow(
      BadRequestException
    );
  });

  it("return a user if a valid password is provided", async () => {
    await service.signUp("asdf@asdf.com", "mypassword");
    const user = await service.signIn("asdf@asdf.com", "mypassword");
    expect(user).toBeDefined();
  });
});

import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signUp(email: string, password: string) {
    // is email in use?
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException("email in use");
    }
    // hash users password
    // generate salt
    const salt = randomBytes(8).toString("hex");
    //hash salt and pw together
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    // join hash result and salt togther
    const result = salt + "." + hash.toString("hex");
    const user = await this.usersService.create(email, result);
    return user;
  }

  async signIn(email: string, password: string) {
    // is email a match?
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new NotFoundException("user not found");
    }
    const [salt, storedHash] = user.password.split(".");
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    if (hash.toString("hex") !== storedHash) {
      throw new BadRequestException("bad password");
    }
    return user;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserBlockEntity } from './entity/Block.entity';

@Injectable()
export class UserBlockChecker {
  constructor(private readonly prismaService: PrismaService) {}

  async isBlocked(
    userIdx: number,
    toUserIdx: number,
  ): Promise<UserBlockEntity | null> {
    const userBlockEntity = await this.prismaService.accountBlockTb.findFirst({
      where: {
        blockerIdx: userIdx,
        blockedIdx: toUserIdx,
      },
    });

    console.log(userBlockEntity);

    return userBlockEntity;
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FollowEntity } from './entity/Follow.entity';
import { UserEntity } from './entity/User.entity';

@Injectable()
export class FollowCheckService {
  constructor(private readonly prismaService: PrismaService) {}

  async isFollow(
    userIdx: number,
    toUsers: UserEntity[],
  ): Promise<UserEntity[]> {
    const sqlResult = await this.prismaService.followTb.findMany({
      select: {
        followee: true,
      },
      where: {
        followerIdx: userIdx,
        followeeIdx: {
          in: toUsers.map((elem) => elem.idx),
        },
      },
    });

    const followingUserList = sqlResult.map((elem) => elem.followee.idx);

    for (let i = 0; i < toUsers.length; i++) {
      if (followingUserList.includes(toUsers[i].idx)) {
        toUsers[i].isFollowing = true;
      }
    }

    return toUsers;
  }
}

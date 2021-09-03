import { Repository } from 'typeorm'
import { NicknameEntity } from 'src/entities'
import { randomInt } from 'src/utils/math'
import { randomNames } from 'src/utils/random-names'
import { geneNewEntity } from 'src/utils/object'

export async function getRandomNickname(repo: Repository<NicknameEntity>) {
  let nickname: string
  try {
    const record = await repo.findOne({
      order: {
        updatedTime: 'ASC',
      }
    })
    if (record) {
      repo.update({
        id: record.id,
      }, geneNewEntity(NicknameEntity, {
        updatedTime: new Date(),
      }))
      nickname = record.name
    } else {
      repo.insert(randomNames.map((item) => {
        const nameRecord = new NicknameEntity()
        nameRecord.name = item
        return nameRecord
      }))
      nickname = randomNames[0]
    }
  } catch (err) {
    // pass
  }
  nickname = nickname || Math.random().toFixed(36)

  return nickname
}

/**
 * @param n n ∈ [1, 30]
 */
export function getRandomAvatar(n?: number) {
  return `/static/images/avatar-minified/${(n || randomInt(1, 30)).toString().padStart(3, '0')}.jpg`
}

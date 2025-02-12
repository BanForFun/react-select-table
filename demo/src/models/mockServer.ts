import comments from '../data/comments.json';

interface CommentContents {
    postId: number;
    name: string;
    email: string;
    body: string;
}

interface Comment extends CommentContents {
    id: number;
}

export default class MockServer {
    #lastId: number = 0;
    readonly #comments: Record<number, Comment> = {};

    constructor() {
        for (const comment of comments) {
            this.#comments[comment.id] = { ...comment };

            if (comment.id > this.#lastId)
                this.#lastId = comment.id;
        }
    }

    #add(contents: CommentContents) {
        const comment: Comment = { id: ++this.#lastId, ...contents };
        this.#comments[comment.id] = comment;

        return comment;
    }

    #delete(id: number) {
        const comment = this.#comments[id];
        delete this.#comments[id];

        return comment;
    }
}

